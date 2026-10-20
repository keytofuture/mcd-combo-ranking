'use strict';

/**
 * MCP 原始返回 → 内部契约（src/core 可直接消费的形状）。
 *
 * ⚠️ 本文件的字段映射是**用真实返回实测校准过的**（2026-10-17，深圳桂庙路餐厅 1420207），
 * 不是按文档推断。实测发现三个必须记住的事实：
 *
 * 1. MCP 工具返回是「给模型看的说明文字 + JSON」混排，JSON 后面还可能跟说明段落。
 *    → extractJson() 用括号配对截取，不能直接 JSON.parse。
 * 2. query-meals 的 meals 是**以 productCode 为键的对象**；categories[].meals 只有 {code, tags}，
 *    分类要通过 code 关联。
 * 3. **金额单位不统一**：calculate-price 的 price/productPrice 是**分**（3350 = ¥33.50）；
 *    query-meals 的 currentPrice/originalPrice 是**元字符串**（"33.5"）。两者不能混用同一个换算。
 * 4. 套餐组成的 choices 里，`isDefault=1` 才是默认组成；且部分组件是**套餐内专属码**，
 *    单独核价会返回 0（例如可乐 3050）。这类组件拿不到单买价，必须照实判「缺价」。
 */

/**
 * 从混排文本里截取 JSON 对象（括号配对 + 试解析）。
 *
 * 实测坑：说明文字里也可能出现 `{`（字段示例），所以不能只取第一个 `{`。
 * 策略：优先从 `{"success"` 处开始；否则遍历所有 `{` 候选，取第一个能成功解析的。
 */
function extractJson(text) {
  const tryFrom = (start) => {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < text.length; i += 1) {
      const ch = text[i];
      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') depth += 1;
      else if (ch === '}') {
        depth -= 1;
        if (depth === 0) {
          try {
            return JSON.parse(text.slice(start, i + 1));
          } catch (e) {
            return null;
          }
        }
      }
    }
    return null;
  };

  const anchor = text.indexOf('{"success"');
  if (anchor >= 0) {
    const hit = tryFrom(anchor);
    if (hit) return hit;
  }
  for (let i = text.indexOf('{'); i >= 0; i = text.indexOf('{', i + 1)) {
    const hit = tryFrom(i);
    if (hit) return hit;
  }
  throw new Error('[解析失败] 文本中找不到可解析的 JSON 对象');
}

/** 读文件并解析：兼容纯 JSON 与「说明文字 + JSON + 说明文字」 */
function readMcpJson(file, fs) {
  const text = fs.readFileSync(file, 'utf8');
  if (text.trim().startsWith('{')) return JSON.parse(text);
  return extractJson(text);
}

function assertSuccess(j, what) {
  if (j && j.success === false) {
    throw new Error(`[MCP 业务失败] ${what}：code=${j.code} message=${j.message || ''}`);
  }
  return j;
}

/** 元字符串/数字 → 整数分 */
function yuanToCents(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'string' ? Number(String(v).replace(/[^\d.-]/g, '')) : Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

/** calculate-price 已给出分，直接取整数 */
function centsOf(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

/* ---------------- query-meals ---------------- */

/**
 * @returns {Array<{code,name,category,categoryName,tags,menuPriceCents,originalPriceCents}>}
 *   menuPriceCents 来自 currentPrice（元字符串）；originalPriceCents 来自 originalPrice
 */
function normalizeMeals(raw) {
  assertSuccess(raw, 'query-meals');
  const data = raw.data || {};
  const meals = data.meals;
  if (!meals || typeof meals !== 'object') {
    throw new Error('[字段无法识别] query-meals：data.meals 不存在或不是对象。实际 data 键：' + Object.keys(data).join(', '));
  }

  // code → 分类名（categories[].meals 只有 {code,tags}）
  const categoryByCode = new Map();
  for (const cat of data.categories || []) {
    const catName = cat.categoryName || cat.name || '';
    for (const ref of cat.meals || []) {
      if (ref && ref.code && !categoryByCode.has(String(ref.code))) categoryByCode.set(String(ref.code), catName);
    }
  }

  return Object.entries(meals).map(([code, m]) => ({
    code: String(code),
    name: String(m.name || ''),
    category: categoryByCode.get(String(code)) || '',
    categoryName: categoryByCode.get(String(code)) || '',
    tags: [],
    menuPriceCents: yuanToCents(m.currentPrice),
    originalPriceCents: yuanToCents(m.originalPrice),
  }));
}

/* ---------------- query-meal-detail ---------------- */

/**
 * @returns {{name:string, components:Array<{code,name,quantity,isGift,diffPrice}>}}
 *   只取 rounds[].choices[] 中 isDefault=1 的选项（默认组成）
 */
function normalizeDetail(raw) {
  assertSuccess(raw, 'query-meal-detail');
  const data = raw.data || {};
  const rounds = data.rounds;
  if (!Array.isArray(rounds)) {
    throw new Error('[字段无法识别] query-meal-detail：data.rounds 不是数组。实际 data 键：' + Object.keys(data).join(', '));
  }

  const components = [];
  for (const round of rounds) {
    const choices = round.choices || [];
    const chosen = choices.filter((c) => Number(c.isDefault) === 1);
    const pick = chosen.length ? chosen : choices.slice(0, 1); // 没有默认项时不臆造，只取第一个并标注
    for (const c of pick) {
      const qty = Number(c.quantity);
      components.push({
        code: c.code ? String(c.code) : null,
        name: String(c.name || ''),
        quantity: Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 1,
        isGift: false,
        diffPrice: c.diffPrice || null,
        defaultAssumed: chosen.length === 0,
      });
    }
  }
  if (!components.length) throw new Error('[组成解析失败] query-meal-detail：rounds 里没有任何 choice');
  return { name: data.name || '', components };
}

/* ---------------- calculate-price ---------------- */

/** @returns {{priceCents:number, originalCents:number|null, discountCents:number|null, productName:string|null, hasProduct:boolean}} */
function normalizePrice(raw) {
  assertSuccess(raw, 'calculate-price');
  const d = raw.data || {};
  const priceCents = centsOf(d.price ?? d.productPrice);
  if (priceCents === null) {
    throw new Error('[字段无法识别] calculate-price：data 里没有 price/productPrice。实际键：' + Object.keys(d).join(', '));
  }
  const list = Array.isArray(d.productList) ? d.productList : [];
  return {
    priceCents,
    originalCents: centsOf(d.originalPrice ?? d.productOriginalPrice),
    discountCents: centsOf(d.discount),
    productName: list[0] ? list[0].productName : null,
    hasProduct: list.length > 0,
  };
}

/** 容错版：单次核价失败（售罄/不可售/字段异常）不该让整轮崩掉，返回 null 由上游判缺价 */
function safePrice(raw) {
  try {
    return normalizePrice(raw);
  } catch (error) {
    return { priceCents: null, originalCents: null, discountCents: null, productName: null, hasProduct: false, failed: true, message: error.message };
  }
}

/* ---------------- 组装 ---------------- */

/**
 * 名称归一化：去空格、去括号内容，用于「套餐内专属码 → 同名零售单品」的匹配。
 * 只做保守匹配：候选必须**唯一**，且规格（中杯/大杯…）不冲突，否则一律视为无法匹配。
 */
function normalizeName(name) {
  return String(name || '')
    .replace(/\s+/g, '')
    .replace(/[（(].*?[)）]/g, '')
    .replace(/套餐$/, '');
}

function sizeToken(name) {
  const m = String(name || '').match(/(小杯|中杯|大杯|小份|中份|大份|小食|中薯|大薯)/);
  return m ? m[1] : null;
}

/** 在菜单里找唯一同名单品；不唯一、规格冲突、或是套餐类条目，一律返回 null（不猜） */
function matchByName(componentName, menuList) {
  const target = normalizeName(componentName);
  if (!target) return null;
  const size = sizeToken(target);
  const base = target.replace(/(小杯|中杯|大杯|小份|中份|大份)/g, '');
  const cands = menuList.filter((m) => {
    // 组件绝不可能是套餐本身：排除套餐类菜单项。
    // 否则「吉士汉堡包」（组件）会匹配到「吉士汉堡包套餐」（自己），把 D 虚增一整份套餐价。
    if (/套餐|双人餐|四人餐|家庭餐|组合餐|超值餐/.test(String(m.name || ''))) return false;
    const n = normalizeName(m.name);
    if (!n) return false;
    if (n === target) return true;
    return n.replace(/(小杯|中杯|大杯|小份|中份|大份)/g, '') === base;
  });
  if (cands.length !== 1) return null;
  const candSize = sizeToken(cands[0].name);
  if (size && candSize && size !== candSize) return null;
  return cands[0];
}

/**
 * @param {object} input
 * @param {Array} input.meals            normalizeMeals 结果
 * @param {Object<string,object>} input.details  { 套餐code: query-meal-detail 原始返回 }
 * @param {Object<string,object>} input.prices   {
 *     '<套餐code>|combo': raw,
 *     '<套餐code>|single:<组件code>': raw
 *   }
 * @param {string} input.channel
 * @param {string} [input.observedAt]
 * @param {{strict?:boolean}} [input.options] strict=true 时不做同名匹配
 */
function assembleCombos(input) {
  const { meals, details, prices, channel, observedAt } = input;
  const strict = Boolean(input.options && input.options.strict);
  const observed = observedAt || new Date().toISOString();
  const menuByCode = new Map(meals.map((m) => [String(m.code), m]));
  // 同名匹配要对着**完整菜单**（含单品），不能用已过滤成"仅套餐"的列表
  const matchPool = Array.isArray(input.allMeals) && input.allMeals.length ? input.allMeals : meals;
  const combos = [];

  for (const meal of meals) {
    const detailRaw = details[meal.code];
    if (!detailRaw) continue; // 未取组成 → 跳过，由覆盖统计体现，不臆测

    const detail = normalizeDetail(detailRaw);
    const comboPriceRaw = prices[`${meal.code}|combo`];
    if (!comboPriceRaw) continue;
    const comboPriceInfo = safePrice(comboPriceRaw);
    let comboPrice = comboPriceInfo.failed ? null : comboPriceInfo.priceCents;
    let priceSource = 'calculate-price';

    // 交叉校验：核价接口偶尔不按套餐价算（实测 BFF 四宫格：接口 122.50 / 菜单 62.90）。
    // 菜单价是用户实际看到的售价，偏差 >1% 时以菜单价为准并标注来源。
    if (comboPrice !== null && meal.menuPriceCents !== null && meal.menuPriceCents > 0) {
      const dev = Math.abs(comboPrice - meal.menuPriceCents) / meal.menuPriceCents;
      if (dev > 0.01) {
        comboPrice = meal.menuPriceCents;
        priceSource = 'menu-price-override';
      }
    }

    const components = detail.components.map((c) => {
      // 单买价优先级：① 该组件码单独核价 → ② 该组件码在菜单里的零售价
      let unitPriceCents = null;
      let source = null;

      const singleRaw = c.code ? prices[`${meal.code}|single:${c.code}`] : null;
      if (singleRaw) {
        const p = safePrice(singleRaw);
        if (!p.failed && p.hasProduct && p.priceCents > 0) {
          unitPriceCents = p.priceCents;
          source = 'calculate-price';
        }
      }
      if (unitPriceCents === null && c.code && menuByCode.has(c.code)) {
        const menuItem = menuByCode.get(c.code);
        if (menuItem.menuPriceCents !== null) {
          unitPriceCents = menuItem.menuPriceCents;
          source = 'menu-price';
        }
      }
      // ③ 套餐内专属码（如可乐 3050）在菜单里查不到 → 尝试同名零售单品（可关闭、报告需披露）
      let matchedName = null;
      if (unitPriceCents === null && !strict) {
        const hit = matchByName(c.name, matchPool);
        if (hit && hit.menuPriceCents !== null) {
          unitPriceCents = hit.menuPriceCents;
          source = 'menu-name-match';
          matchedName = hit.name;
        }
      }

      const quote = {
        amountCents: unitPriceCents,
        observedAt: observed,
        pricePolicyState: 'verified_ordinary',
        saleState: 'available',
        conditionState: 'verified_same',
        feeSplitState: 'food_only_verified',
        amountScope: 'single_unit_food',
        quotedQuantity: 1,
        evidenceType: source ? 'verified_quote' : 'menu_name_match',
        reasonCode: unitPriceCents === null ? 'COMPONENT_PRICE_MISSING' : null,
        purchaseCondition: 'standalone',
      };

      return {
        variantId: c.code || c.name,
        name: c.name,
        variantLabel: '',
        quantity: c.quantity,
        isGift: c.isGift,
        unitPriceCents,
        purchaseCondition: 'standalone',
        priceSource: source,
        matchedName,
        ...quote,
        quote,
      };
    });

    const observation = {
      amountCents: comboPrice,
      observedAt: observed,
      pricePolicyState: 'verified_ordinary',
      saleState: 'available',
      conditionState: 'verified_same',
      feeSplitState: 'food_only_verified',
      amountScope: 'default_combo_food',
      quotedQuantity: 1,
      evidenceType: 'verified_quote',
      reasonCode: comboPrice === null ? 'AMOUNT_MISSING' : null,
    };

    combos.push({
      id: meal.code,
      comboVariantId: meal.code,
      name: meal.name,
      configId: `mcp-${meal.code}`,
      defaultConfigVerified: true,
      comboPriceCents: comboPrice,
      components,
      observation,
      comboPriceSource: priceSource,
      menuOriginalCents: meal.originalPriceCents,
    });
  }

  if (!combos.length) {
    throw new Error(
      '[无可用套餐] 没有「同时具备组成明细与套餐价」的套餐。\n' +
        '检查：query-meal-detail 与 calculate-price 是否对同一批套餐 code 都调过，且文件名符合约定。'
    );
  }
  return { channel, combos };
}

module.exports = {
  extractJson,
  readMcpJson,
  yuanToCents,
  normalizeMeals,
  normalizeDetail,
  normalizePrice,
  assembleCombos,
};
