# MCP_INTEGRATION.md

本 Skill 如何使用麦当劳中国 MCP 服务。

- MCP Server：`https://mcp.mcd.cn`（Streamable HTTP）
- 鉴权：`Authorization: Bearer $MCD_TOKEN`（Token 只存在于客户端配置，**不进入本仓库任何文件**）
- 限流：600 次/分钟（官方说明）；本 Skill 单次请求上限 60 次调用，远低于限流阈值

---

## 1. 用到的工具

| 工具 | 用途 | 调用次数 |
|---|---|---|
| `query-nearby-stores` | 到店自取：定位用户附近门店 | 1 |
| `delivery-query-addresses` | 外送：取用户已有配送地址 | 1 |
| `delivery-query-stores` | 外送：取该地址可配送门店 | 1 |
| `query-meals` | 拉当前门店在售餐品列表（编码、名称、分类、标签） | 1 |
| `query-meal-detail` | 按餐品编码取**默认套餐组成**（单品编码、名称、数量、是否赠品） | ≤12 |
| `calculate-price` | 算金额：套餐本身 1 次 + 每个组成单品单独 1 次 | ≤40 |

合计 **≤60 次/请求**，有硬上限，超限就减少套餐数量而不是估算补齐。

**不调用**：`create-order`、`cancel-order`、`mall-create-order`、`draw-lottery`、`auto-bind-coupons` 等任何写操作或账号操作类工具。本 Skill 只读不写。

---

## 2. 调用链

```
用户问「XX 店哪个套餐最划算」
        │
        ├─ ① 定门店
        │   自取：query-nearby-stores(位置)
        │   外送：delivery-query-addresses → delivery-query-stores
        │
        ├─ ② query-meals(门店)                    → 餐品编码清单
        │
        ├─ ③ query-meal-detail(编码) × 候选套餐    → 每个套餐的默认组成
        │
        ├─ ④ calculate-price × (套餐 + 各组成单品)  → 套餐价 P、单品单买价
        │
        └─ ⑤ node scripts/live/rank.js             → 折扣比 → 排名 → 报告
```

第 ⑤ 步在本地完成：MCP 只负责"给我事实"，**算折扣、判资格、排名次全部在不联网的 `src/core` 里做**。这样每个数字都可被单元测试复现。

---

## 3. 为什么只调这些、只这样调

### 3.1 一次用户请求 = 一轮查询

- 没有定时器、没有调度器、没有后台轮询（`test/scope.test.js` 会扫描源码，出现 `setInterval`/`cron` 即失败）。
- 不缓存跨会话结果再"刷新"，每次都是用户问、才查。
- 失败不重试：某个 `calculate-price` 失败就记 `unknown`，该套餐进「暂不可比较」，继续算其它。

对应《麦当劳 MCP 服务规则》的边界：规则禁止的是**批量、高频或自动化调用**；本 Skill 是**用户主动触发的一次有界查询**，调用量由用户的问题决定，不由程序自行发起。

### 3.2 价格口径

只取普通可购价。若 `calculate-price` 的返回中带出优惠券或会员权益导致的减免（`discountAmount`/`couponAmount` 非 0），该套餐按「价格口径不可核实」处理，不参与排名——否则会把"用了券的价格"当成套餐本身便宜，形成误导。

### 3.3 费用剥离

`calculate-price` 会同时返回餐品金额与配送/包装费。本 Skill **只取餐品金额**作为 `P` 与 `D` 的分子分母；费用单列展示，不计入折扣。外送场景下报告明确写「不是配送到手总价」。

---

## 4. 实测校准记录（2026-10-17，真实门店 1420207）

本节所有结论都来自**真实调用**，不是按文档推断。改动前请先看这里。

| # | 事实 | 影响 |
|---|---|---|
| 1 | 工具返回是「给模型看的说明文字 + JSON + 说明文字」混排 | 必须按括号配对截取；说明文字里也可能出现 `{`，要逐候选试解析 |
| 2 | `query-meals` 的 `data.meals` 是**以 productCode 为键的对象**；`categories[].meals` 只有 `{code, tags}` | 分类要按 code 关联，不能直接遍历分类拿餐品 |
| 3 | **金额单位不统一**：`calculate-price` 的 `price/productPrice/originalPrice` 是**分**（3350 = ¥33.50）；`query-meals` 的 `currentPrice/originalPrice` 是**元字符串**（"33.5"） | 两处换算方式不同，混用会差 100 倍 |
| 4 | 套餐组成在 `data.rounds[].choices[]`，`isDefault=1` 才是默认组成 | 取默认组成不能取第一个 choice |
| 5 | **套餐内专属码没有独立售价**：如可乐 `3050` 单独立项 `calculate-price` 返回 `price=0` 且 `productList` 为空，菜单里也没有这个码 | 严格口径下几乎所有含饮料的套餐都会判「缺价」——这是真实业务约束，不是 bug |
| 6 | 菜单上的 `originalPrice` **不等于**单买合计：麦香鱼套餐菜单标 ¥46，实际 22.50+13.50+9.50 = ¥45.50（严格按三个可核价单品则是 ¥36） | 不能拿菜单原价冒充单买合计，必须逐项核价 |
| 7 | 必填参数：`query-meals`/`query-meal-detail`/`calculate-price` 都要 `beType` + `orderType` + `storeCode`；`query-meal-detail` 还要 `code`；`query-nearby-stores` 要 `beType` + `searchType`（按位置搜索时还需 `city`/`keyword`） | 少传就报 `600058 城市名或者关键词不能为空` 之类业务错误 |
| 8 | **套餐清单必须从 `query-meals` 自动枚举，不能用手写候选表**。曾用一份手写 8 项→后来补到 23 项的清单，而菜单里实际有 43 个套餐；「菜单里有、清单里没有」的套餐永远不会被尝试，榜单却是按「已发现套餐」做分母，覆盖率于是虚高 | 改为按名称规则自动枚举（`/套餐\|件套\|组合\|超值\|随心选\|拼盘\|双人\|家庭\|桶/`）。补全后可比项从 11 个升到 16 个 |
| 9 | **「随心选 / 随心配」类套餐的默认组成不可信**。实测「学生专享汉堡小食随心选」`rounds[].choices[]` 只返回「中薯条×2」，「学生专享饮品随心选」只返回「可乐中杯×1」——名称描述的内容和默认组成完全不是一回事 | 这类套餐若默认组成条目 ≤1，判 `DEFAULT_CONFIG_INCOMPLETE` 退出主榜（见 `src/core/eligibility.js`），不拿残缺组成算折扣 |
| 10 | **菜单是动态的**。2026-10-17 与 2026-10-20 两次抓取之间，门店套餐从 44 个变为 43 个（新增「龙焰美味四件套」「牛气满满套餐」「学生专享…」等，也有下架），餐品总数 128 → 124 | 快照必须标注抓取时刻；跨天复用旧菜单会漏掉新套餐，每次刷新都要重抓 `query-meals` |

### 关键字段映射（实测）

| 内部字段 | 真实来源 |
|---|---|
| 餐品编码 | `data.meals` 的**键** |
| 餐品名 / 菜单价 / 菜单原价 | `data.meals[code].name` / `.currentPrice`（元） / `.originalPrice`（元） |
| 分类 | `data.categories[].meals[].code` → `categoryName` |
| 套餐价 P | `calculate-price.data.price`（分） |
| 单买价 | 对组件码单独调 `calculate-price` 取 `data.price`（分） |
| 默认组成 | `query-meal-detail.data.rounds[].choices[]` 中 `isDefault=1` 的项 |
| 名称 | `query-meal-detail.data.name`（可能带「中套餐」后缀，与菜单名不完全一致） |

### 套餐内专属码的处置策略

组件码在 `calculate-price` 里拿不到价时，按顺序尝试：

1. 该组件码在菜单里的 `currentPrice`（有就用，来源标 `menu-price`）
2. **唯一同名零售单品**的菜单价（来源标 `menu-name-match`，报告会披露条数）
3. 都不成立 → 该套餐判「组成单品缺价」，退出主榜

第 2 步是保守匹配：名称归一化后必须**唯一命中**，且规格词（中杯/大杯/小份…）不冲突；有歧义就不猜。加 `--strict` 可完全关闭这一步。

实测效果：麦香鱼套餐按策略 2 补出可乐 ¥9.50，D = ¥45.50，与菜单标称原价 ¥46 基本吻合——这是策略正确性的旁证，但仍属推断，故必须在报告里披露。

---

## 5. 错误处理

| 情况 | 表现 |
|---|---|
| 401 Token 无效/过期 | 提示用户检查 `MCD_TOKEN`，不重试 |
| 429 触发限流 | 停止本轮，说明已完成的套餐结果，不自动重试 |
| 门店查不到 | 请用户换更明确的位置描述，不猜门店 |
| 某套餐组成取不到 | 该套餐进「暂不可比较」，原因「默认组成未知」 |
| 某单品核价失败 | 该套餐进「暂不可比较」，原因「组成单品缺价」 |
| 菜单返回不全 | 报告标注「仅已发现的套餐」，并置 `catalogComplete=false` |

---

## 6. 隐私

- Token 只经环境变量注入 MCP 客户端；仓库内只有 `mcp-config.example.json` 的占位符。
- 外送地址在报告里只显示用户给它的别名（如「家」「公司」），不写完整地址。
- 原始返回落盘在 `.mcd-live/`（已 gitignore），其中可能含门店编码，**不提交**。
