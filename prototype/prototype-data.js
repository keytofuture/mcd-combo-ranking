/* 自动生成，请勿手改。来源：scripts/lib/demo-payload.js（数值由 src/core 统一规则计算） */
window.PROTOTYPE_DATA = {
  "mode": "demo",
  "timezone": "Asia/Shanghai",
  "generatedAt": "2026-10-16T04:12:00.000Z",
  "generatedAtDisplay": "2026-10-16 12:12",
  "observedAtDisplay": "2026-10-16 12:00",
  "pricePolicyLabel": "普通可购价（含直接促销，不含个人券与付费会员）",
  "banner": "演示数据：虚构门店、商品与地址，不代表任何真实麦当劳报价",
  "contexts": [
    {
      "id": "ctx-pickup-demo",
      "version": 1,
      "contextVersion": "ctx-pickup-demo@v1",
      "channel": "pickup",
      "storeName": "演示店·到店自取",
      "addressAlias": null,
      "pricePolicy": "ordinary_direct_promo_no_personal_coupon_no_paid_membership",
      "deliveryFeeCents": null,
      "minOrderCents": null
    },
    {
      "id": "ctx-delivery-demo",
      "version": 1,
      "contextVersion": "ctx-delivery-demo@v1",
      "channel": "delivery",
      "storeName": "演示店·麦乐送",
      "addressAlias": "演示地址A",
      "pricePolicy": "ordinary_direct_promo_no_personal_coupon_no_paid_membership",
      "deliveryFeeCents": 600,
      "minOrderCents": 2000
    }
  ],
  "channels": {
    "pickup": {
      "contextVersion": "ctx-pickup-demo@v1",
      "storeName": "演示店·到店自取",
      "addressAlias": null,
      "deliveryFeeCents": null,
      "minOrderCents": null,
      "scenarios": {
        "normal": {
          "published": {
            "batchId": "batch-current-01",
            "status": "completed",
            "ranking": [
              {
                "id": "demo-combo-nuggets",
                "comboVariantId": "demo-combo-v3",
                "name": "演示套餐·鸡块",
                "configId": "demo-config-nuggets-v1",
                "P": 1990,
                "D": 3500,
                "A": 1510,
                "ratio": {
                  "num": 1990,
                  "den": 3500
                },
                "display": {
                  "discountText": "5.7折",
                  "savedPercentText": "节省43.1%",
                  "savedAmountText": "少花¥15.10",
                  "comparisonText": null,
                  "ratioText": "1990/3500"
                },
                "compositionSummary": "演示鸡块(5块装)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 1
              },
              {
                "id": "demo-combo-basic",
                "comboVariantId": "demo-combo-v1",
                "name": "演示套餐·基础",
                "configId": "demo-config-basic-v1",
                "P": 2760,
                "D": 4600,
                "A": 1840,
                "ratio": {
                  "num": 2760,
                  "den": 4600
                },
                "display": {
                  "discountText": "6.0折",
                  "savedPercentText": "节省40%",
                  "savedAmountText": "少花¥18.40",
                  "comparisonText": null,
                  "ratioText": "2760/4600"
                },
                "compositionSummary": "演示汉堡(中份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 2
              },
              {
                "id": "demo-combo-large",
                "comboVariantId": "demo-combo-v2",
                "name": "演示套餐·大份",
                "configId": "demo-config-large-v1",
                "P": 3600,
                "D": 5400,
                "A": 1800,
                "ratio": {
                  "num": 3600,
                  "den": 5400
                },
                "display": {
                  "discountText": "6.7折",
                  "savedPercentText": "节省33.3%",
                  "savedAmountText": "少花¥18.00",
                  "comparisonText": null,
                  "ratioText": "3600/5400"
                },
                "compositionSummary": "演示汉堡(大份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 3
              }
            ],
            "notComparable": [
              {
                "id": "demo-combo-sweet",
                "comboVariantId": "demo-combo-v4",
                "name": "演示套餐·甜品",
                "configId": "demo-config-sweet-v1",
                "P": 1500,
                "D": null,
                "reasons": [
                  "COMPONENT_PRICE_MISSING"
                ],
                "reasonText": "COMPONENT_PRICE_MISSING"
              },
              {
                "id": "demo-combo-limited",
                "comboVariantId": "demo-combo-v6",
                "name": "演示套餐·限时",
                "configId": "demo-config-limited-v1",
                "P": 2880,
                "D": 3400,
                "reasons": [
                  "SALE_NOT_AVAILABLE"
                ],
                "reasonText": "SALE_NOT_AVAILABLE"
              },
              {
                "id": "demo-combo-holiday",
                "comboVariantId": "demo-combo-v5",
                "name": "演示套餐·节日限定",
                "configId": null,
                "P": null,
                "D": 0,
                "reasons": [
                  "DEFAULT_CONFIG_UNKNOWN",
                  "AMOUNT_MISSING",
                  "DENOMINATOR_NOT_POSITIVE"
                ],
                "reasonText": "DEFAULT_CONFIG_UNKNOWN、AMOUNT_MISSING、DENOMINATOR_NOT_POSITIVE"
              }
            ],
            "coverage": {
              "catalogComplete": true,
              "discoveredComboCount": 6,
              "requiredSingleCount": 6,
              "quoteSuccessCount": 10,
              "eligibleComboCount": 3,
              "quoteFailureCount": 0,
              "missingPriceCount": 2,
              "fullStoreCoverageRatio": 0.5,
              "summaryText": "已发现 6 个套餐，其中 3 个可比；所需单品规格 6 个，成功报价 10 个，失败 0 个，缺价 2 个"
            },
            "observedRange": {
              "start": "2026-10-16T04:00:00.000Z",
              "end": "2026-10-16T04:00:00.000Z",
              "display": "2026-10-16 12:00"
            },
            "validityState": "unknown"
          },
          "displayState": "current_snapshot",
          "isStale": false,
          "note": "本次结果已发布",
          "noteLevel": "info",
          "activeStatus": null
        },
        "empty": {
          "published": null,
          "displayState": "empty",
          "isStale": false,
          "note": null,
          "noteLevel": null,
          "activeStatus": null
        },
        "updating": {
          "published": {
            "batchId": "batch-previous-01",
            "status": "completed",
            "ranking": [
              {
                "id": "demo-combo-nuggets",
                "comboVariantId": "demo-combo-v3",
                "name": "演示套餐·鸡块",
                "configId": "demo-config-nuggets-v1",
                "P": 1990,
                "D": 3500,
                "A": 1510,
                "ratio": {
                  "num": 1990,
                  "den": 3500
                },
                "display": {
                  "discountText": "5.7折",
                  "savedPercentText": "节省43.1%",
                  "savedAmountText": "少花¥15.10",
                  "comparisonText": null,
                  "ratioText": "1990/3500"
                },
                "compositionSummary": "演示鸡块(5块装)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 1
              },
              {
                "id": "demo-combo-basic",
                "comboVariantId": "demo-combo-v1",
                "name": "演示套餐·基础",
                "configId": "demo-config-basic-v1",
                "P": 2760,
                "D": 4600,
                "A": 1840,
                "ratio": {
                  "num": 2760,
                  "den": 4600
                },
                "display": {
                  "discountText": "6.0折",
                  "savedPercentText": "节省40%",
                  "savedAmountText": "少花¥18.40",
                  "comparisonText": null,
                  "ratioText": "2760/4600"
                },
                "compositionSummary": "演示汉堡(中份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 2
              },
              {
                "id": "demo-combo-large",
                "comboVariantId": "demo-combo-v2",
                "name": "演示套餐·大份",
                "configId": "demo-config-large-v1",
                "P": 3600,
                "D": 5400,
                "A": 1800,
                "ratio": {
                  "num": 3600,
                  "den": 5400
                },
                "display": {
                  "discountText": "6.7折",
                  "savedPercentText": "节省33.3%",
                  "savedAmountText": "少花¥18.00",
                  "comparisonText": null,
                  "ratioText": "3600/5400"
                },
                "compositionSummary": "演示汉堡(大份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 3
              }
            ],
            "notComparable": [
              {
                "id": "demo-combo-sweet",
                "comboVariantId": "demo-combo-v4",
                "name": "演示套餐·甜品",
                "configId": "demo-config-sweet-v1",
                "P": 1500,
                "D": null,
                "reasons": [
                  "COMPONENT_PRICE_MISSING"
                ],
                "reasonText": "COMPONENT_PRICE_MISSING"
              },
              {
                "id": "demo-combo-limited",
                "comboVariantId": "demo-combo-v6",
                "name": "演示套餐·限时",
                "configId": "demo-config-limited-v1",
                "P": 2880,
                "D": 3400,
                "reasons": [
                  "SALE_NOT_AVAILABLE"
                ],
                "reasonText": "SALE_NOT_AVAILABLE"
              },
              {
                "id": "demo-combo-holiday",
                "comboVariantId": "demo-combo-v5",
                "name": "演示套餐·节日限定",
                "configId": null,
                "P": null,
                "D": 0,
                "reasons": [
                  "DEFAULT_CONFIG_UNKNOWN",
                  "AMOUNT_MISSING",
                  "DENOMINATOR_NOT_POSITIVE"
                ],
                "reasonText": "DEFAULT_CONFIG_UNKNOWN、AMOUNT_MISSING、DENOMINATOR_NOT_POSITIVE"
              }
            ],
            "coverage": {
              "catalogComplete": true,
              "discoveredComboCount": 6,
              "requiredSingleCount": 6,
              "quoteSuccessCount": 10,
              "eligibleComboCount": 3,
              "quoteFailureCount": 0,
              "missingPriceCount": 2,
              "fullStoreCoverageRatio": 0.5,
              "summaryText": "已发现 6 个套餐，其中 3 个可比；所需单品规格 6 个，成功报价 10 个，失败 0 个，缺价 2 个"
            },
            "observedRange": {
              "start": "2026-10-16T01:30:00.000Z",
              "end": "2026-10-16T01:30:00.000Z",
              "display": "2026-10-16 09:30"
            },
            "validityState": "unknown"
          },
          "displayState": "previous_result",
          "isStale": true,
          "note": "更新进行中，以下仍为上次已发布结果",
          "noteLevel": "info",
          "activeStatus": "running"
        },
        "partial": {
          "published": {
            "batchId": "batch-partial-01",
            "status": "partial",
            "ranking": [
              {
                "id": "demo-combo-nuggets",
                "comboVariantId": "demo-combo-v3",
                "name": "演示套餐·鸡块",
                "configId": "demo-config-nuggets-v1",
                "P": 1990,
                "D": 3500,
                "A": 1510,
                "ratio": {
                  "num": 1990,
                  "den": 3500
                },
                "display": {
                  "discountText": "5.7折",
                  "savedPercentText": "节省43.1%",
                  "savedAmountText": "少花¥15.10",
                  "comparisonText": null,
                  "ratioText": "1990/3500"
                },
                "compositionSummary": "演示鸡块(5块装)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 1
              },
              {
                "id": "demo-combo-basic",
                "comboVariantId": "demo-combo-v1",
                "name": "演示套餐·基础",
                "configId": "demo-config-basic-v1",
                "P": 2760,
                "D": 4600,
                "A": 1840,
                "ratio": {
                  "num": 2760,
                  "den": 4600
                },
                "display": {
                  "discountText": "6.0折",
                  "savedPercentText": "节省40%",
                  "savedAmountText": "少花¥18.40",
                  "comparisonText": null,
                  "ratioText": "2760/4600"
                },
                "compositionSummary": "演示汉堡(中份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 2
              },
              {
                "id": "demo-combo-large",
                "comboVariantId": "demo-combo-v2",
                "name": "演示套餐·大份",
                "configId": "demo-config-large-v1",
                "P": 3600,
                "D": 5400,
                "A": 1800,
                "ratio": {
                  "num": 3600,
                  "den": 5400
                },
                "display": {
                  "discountText": "6.7折",
                  "savedPercentText": "节省33.3%",
                  "savedAmountText": "少花¥18.00",
                  "comparisonText": null,
                  "ratioText": "3600/5400"
                },
                "compositionSummary": "演示汉堡(大份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 3
              }
            ],
            "notComparable": [
              {
                "id": "demo-combo-sweet",
                "comboVariantId": "demo-combo-v4",
                "name": "演示套餐·甜品",
                "configId": "demo-config-sweet-v1",
                "P": 1500,
                "D": null,
                "reasons": [
                  "COMPONENT_PRICE_MISSING"
                ],
                "reasonText": "COMPONENT_PRICE_MISSING"
              },
              {
                "id": "demo-combo-limited",
                "comboVariantId": "demo-combo-v6",
                "name": "演示套餐·限时",
                "configId": "demo-config-limited-v1",
                "P": 2880,
                "D": 3400,
                "reasons": [
                  "SALE_NOT_AVAILABLE"
                ],
                "reasonText": "SALE_NOT_AVAILABLE"
              },
              {
                "id": "demo-combo-holiday",
                "comboVariantId": "demo-combo-v5",
                "name": "演示套餐·节日限定",
                "configId": null,
                "P": null,
                "D": 0,
                "reasons": [
                  "DEFAULT_CONFIG_UNKNOWN",
                  "AMOUNT_MISSING",
                  "DENOMINATOR_NOT_POSITIVE"
                ],
                "reasonText": "DEFAULT_CONFIG_UNKNOWN、AMOUNT_MISSING、DENOMINATOR_NOT_POSITIVE"
              }
            ],
            "coverage": {
              "catalogComplete": false,
              "discoveredComboCount": 6,
              "requiredSingleCount": 6,
              "quoteSuccessCount": 10,
              "eligibleComboCount": 3,
              "quoteFailureCount": 0,
              "missingPriceCount": 2,
              "fullStoreCoverageRatio": null,
              "summaryText": "已发现 6 个套餐，其中 3 个可比；所需单品规格 6 个，成功报价 10 个，失败 0 个，缺价 2 个"
            },
            "observedRange": {
              "start": "2026-10-16T04:00:00.000Z",
              "end": "2026-10-16T04:00:00.000Z",
              "display": "2026-10-16 12:00"
            },
            "validityState": "unknown"
          },
          "displayState": "current_snapshot",
          "isStale": false,
          "note": "本次为局部结果，目录不完整",
          "noteLevel": "warn",
          "activeStatus": null
        },
        "failed_keep_previous": {
          "published": {
            "batchId": "batch-previous-01",
            "status": "completed",
            "ranking": [
              {
                "id": "demo-combo-nuggets",
                "comboVariantId": "demo-combo-v3",
                "name": "演示套餐·鸡块",
                "configId": "demo-config-nuggets-v1",
                "P": 1990,
                "D": 3500,
                "A": 1510,
                "ratio": {
                  "num": 1990,
                  "den": 3500
                },
                "display": {
                  "discountText": "5.7折",
                  "savedPercentText": "节省43.1%",
                  "savedAmountText": "少花¥15.10",
                  "comparisonText": null,
                  "ratioText": "1990/3500"
                },
                "compositionSummary": "演示鸡块(5块装)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 1
              },
              {
                "id": "demo-combo-basic",
                "comboVariantId": "demo-combo-v1",
                "name": "演示套餐·基础",
                "configId": "demo-config-basic-v1",
                "P": 2760,
                "D": 4600,
                "A": 1840,
                "ratio": {
                  "num": 2760,
                  "den": 4600
                },
                "display": {
                  "discountText": "6.0折",
                  "savedPercentText": "节省40%",
                  "savedAmountText": "少花¥18.40",
                  "comparisonText": null,
                  "ratioText": "2760/4600"
                },
                "compositionSummary": "演示汉堡(中份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 2
              },
              {
                "id": "demo-combo-large",
                "comboVariantId": "demo-combo-v2",
                "name": "演示套餐·大份",
                "configId": "demo-config-large-v1",
                "P": 3600,
                "D": 5400,
                "A": 1800,
                "ratio": {
                  "num": 3600,
                  "den": 5400
                },
                "display": {
                  "discountText": "6.7折",
                  "savedPercentText": "节省33.3%",
                  "savedAmountText": "少花¥18.00",
                  "comparisonText": null,
                  "ratioText": "3600/5400"
                },
                "compositionSummary": "演示汉堡(大份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 3
              }
            ],
            "notComparable": [
              {
                "id": "demo-combo-sweet",
                "comboVariantId": "demo-combo-v4",
                "name": "演示套餐·甜品",
                "configId": "demo-config-sweet-v1",
                "P": 1500,
                "D": null,
                "reasons": [
                  "COMPONENT_PRICE_MISSING"
                ],
                "reasonText": "COMPONENT_PRICE_MISSING"
              },
              {
                "id": "demo-combo-limited",
                "comboVariantId": "demo-combo-v6",
                "name": "演示套餐·限时",
                "configId": "demo-config-limited-v1",
                "P": 2880,
                "D": 3400,
                "reasons": [
                  "SALE_NOT_AVAILABLE"
                ],
                "reasonText": "SALE_NOT_AVAILABLE"
              },
              {
                "id": "demo-combo-holiday",
                "comboVariantId": "demo-combo-v5",
                "name": "演示套餐·节日限定",
                "configId": null,
                "P": null,
                "D": 0,
                "reasons": [
                  "DEFAULT_CONFIG_UNKNOWN",
                  "AMOUNT_MISSING",
                  "DENOMINATOR_NOT_POSITIVE"
                ],
                "reasonText": "DEFAULT_CONFIG_UNKNOWN、AMOUNT_MISSING、DENOMINATOR_NOT_POSITIVE"
              }
            ],
            "coverage": {
              "catalogComplete": true,
              "discoveredComboCount": 6,
              "requiredSingleCount": 6,
              "quoteSuccessCount": 10,
              "eligibleComboCount": 3,
              "quoteFailureCount": 0,
              "missingPriceCount": 2,
              "fullStoreCoverageRatio": 0.5,
              "summaryText": "已发现 6 个套餐，其中 3 个可比；所需单品规格 6 个，成功报价 10 个，失败 0 个，缺价 2 个"
            },
            "observedRange": {
              "start": "2026-10-16T01:30:00.000Z",
              "end": "2026-10-16T01:30:00.000Z",
              "display": "2026-10-16 09:30"
            },
            "validityState": "unknown"
          },
          "displayState": "previous_result",
          "isStale": false,
          "note": "本次更新失败/未执行，以下为上次结果",
          "noteLevel": "warn",
          "activeStatus": null
        },
        "failed_no_previous": {
          "published": null,
          "displayState": "empty",
          "isStale": false,
          "note": "本次更新失败/未执行，暂无历史结果",
          "noteLevel": "warn",
          "activeStatus": null
        },
        "expired": {
          "published": {
            "batchId": "batch-current-01",
            "status": "completed",
            "ranking": [
              {
                "id": "demo-combo-nuggets",
                "comboVariantId": "demo-combo-v3",
                "name": "演示套餐·鸡块",
                "configId": "demo-config-nuggets-v1",
                "P": 1990,
                "D": 3500,
                "A": 1510,
                "ratio": {
                  "num": 1990,
                  "den": 3500
                },
                "display": {
                  "discountText": "5.7折",
                  "savedPercentText": "节省43.1%",
                  "savedAmountText": "少花¥15.10",
                  "comparisonText": null,
                  "ratioText": "1990/3500"
                },
                "compositionSummary": "演示鸡块(5块装)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 1
              },
              {
                "id": "demo-combo-basic",
                "comboVariantId": "demo-combo-v1",
                "name": "演示套餐·基础",
                "configId": "demo-config-basic-v1",
                "P": 2760,
                "D": 4600,
                "A": 1840,
                "ratio": {
                  "num": 2760,
                  "den": 4600
                },
                "display": {
                  "discountText": "6.0折",
                  "savedPercentText": "节省40%",
                  "savedAmountText": "少花¥18.40",
                  "comparisonText": null,
                  "ratioText": "2760/4600"
                },
                "compositionSummary": "演示汉堡(中份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 2
              },
              {
                "id": "demo-combo-large",
                "comboVariantId": "demo-combo-v2",
                "name": "演示套餐·大份",
                "configId": "demo-config-large-v1",
                "P": 3600,
                "D": 5400,
                "A": 1800,
                "ratio": {
                  "num": 3600,
                  "den": 5400
                },
                "display": {
                  "discountText": "6.7折",
                  "savedPercentText": "节省33.3%",
                  "savedAmountText": "少花¥18.00",
                  "comparisonText": null,
                  "ratioText": "3600/5400"
                },
                "compositionSummary": "演示汉堡(大份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 3
              }
            ],
            "notComparable": [
              {
                "id": "demo-combo-sweet",
                "comboVariantId": "demo-combo-v4",
                "name": "演示套餐·甜品",
                "configId": "demo-config-sweet-v1",
                "P": 1500,
                "D": null,
                "reasons": [
                  "COMPONENT_PRICE_MISSING"
                ],
                "reasonText": "COMPONENT_PRICE_MISSING"
              },
              {
                "id": "demo-combo-limited",
                "comboVariantId": "demo-combo-v6",
                "name": "演示套餐·限时",
                "configId": "demo-config-limited-v1",
                "P": 2880,
                "D": 3400,
                "reasons": [
                  "SALE_NOT_AVAILABLE"
                ],
                "reasonText": "SALE_NOT_AVAILABLE"
              },
              {
                "id": "demo-combo-holiday",
                "comboVariantId": "demo-combo-v5",
                "name": "演示套餐·节日限定",
                "configId": null,
                "P": null,
                "D": 0,
                "reasons": [
                  "DEFAULT_CONFIG_UNKNOWN",
                  "AMOUNT_MISSING",
                  "DENOMINATOR_NOT_POSITIVE"
                ],
                "reasonText": "DEFAULT_CONFIG_UNKNOWN、AMOUNT_MISSING、DENOMINATOR_NOT_POSITIVE"
              }
            ],
            "coverage": {
              "catalogComplete": true,
              "discoveredComboCount": 6,
              "requiredSingleCount": 6,
              "quoteSuccessCount": 10,
              "eligibleComboCount": 3,
              "quoteFailureCount": 0,
              "missingPriceCount": 2,
              "fullStoreCoverageRatio": 0.5,
              "summaryText": "已发现 6 个套餐，其中 3 个可比；所需单品规格 6 个，成功报价 10 个，失败 0 个，缺价 2 个"
            },
            "observedRange": {
              "start": "2026-10-16T04:00:00.000Z",
              "end": "2026-10-16T04:00:00.000Z",
              "display": "2026-10-16 12:00"
            },
            "validityState": "expired"
          },
          "displayState": "current_snapshot",
          "isStale": false,
          "note": "报价已过期，请手动更新榜单",
          "noteLevel": "warn",
          "activeStatus": null
        },
        "validity_unknown": {
          "published": {
            "batchId": "batch-current-01",
            "status": "completed",
            "ranking": [
              {
                "id": "demo-combo-nuggets",
                "comboVariantId": "demo-combo-v3",
                "name": "演示套餐·鸡块",
                "configId": "demo-config-nuggets-v1",
                "P": 1990,
                "D": 3500,
                "A": 1510,
                "ratio": {
                  "num": 1990,
                  "den": 3500
                },
                "display": {
                  "discountText": "5.7折",
                  "savedPercentText": "节省43.1%",
                  "savedAmountText": "少花¥15.10",
                  "comparisonText": null,
                  "ratioText": "1990/3500"
                },
                "compositionSummary": "演示鸡块(5块装)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 1
              },
              {
                "id": "demo-combo-basic",
                "comboVariantId": "demo-combo-v1",
                "name": "演示套餐·基础",
                "configId": "demo-config-basic-v1",
                "P": 2760,
                "D": 4600,
                "A": 1840,
                "ratio": {
                  "num": 2760,
                  "den": 4600
                },
                "display": {
                  "discountText": "6.0折",
                  "savedPercentText": "节省40%",
                  "savedAmountText": "少花¥18.40",
                  "comparisonText": null,
                  "ratioText": "2760/4600"
                },
                "compositionSummary": "演示汉堡(中份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 2
              },
              {
                "id": "demo-combo-large",
                "comboVariantId": "demo-combo-v2",
                "name": "演示套餐·大份",
                "configId": "demo-config-large-v1",
                "P": 3600,
                "D": 5400,
                "A": 1800,
                "ratio": {
                  "num": 3600,
                  "den": 5400
                },
                "display": {
                  "discountText": "6.7折",
                  "savedPercentText": "节省33.3%",
                  "savedAmountText": "少花¥18.00",
                  "comparisonText": null,
                  "ratioText": "3600/5400"
                },
                "compositionSummary": "演示汉堡(大份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 3
              }
            ],
            "notComparable": [
              {
                "id": "demo-combo-sweet",
                "comboVariantId": "demo-combo-v4",
                "name": "演示套餐·甜品",
                "configId": "demo-config-sweet-v1",
                "P": 1500,
                "D": null,
                "reasons": [
                  "COMPONENT_PRICE_MISSING"
                ],
                "reasonText": "COMPONENT_PRICE_MISSING"
              },
              {
                "id": "demo-combo-limited",
                "comboVariantId": "demo-combo-v6",
                "name": "演示套餐·限时",
                "configId": "demo-config-limited-v1",
                "P": 2880,
                "D": 3400,
                "reasons": [
                  "SALE_NOT_AVAILABLE"
                ],
                "reasonText": "SALE_NOT_AVAILABLE"
              },
              {
                "id": "demo-combo-holiday",
                "comboVariantId": "demo-combo-v5",
                "name": "演示套餐·节日限定",
                "configId": null,
                "P": null,
                "D": 0,
                "reasons": [
                  "DEFAULT_CONFIG_UNKNOWN",
                  "AMOUNT_MISSING",
                  "DENOMINATOR_NOT_POSITIVE"
                ],
                "reasonText": "DEFAULT_CONFIG_UNKNOWN、AMOUNT_MISSING、DENOMINATOR_NOT_POSITIVE"
              }
            ],
            "coverage": {
              "catalogComplete": true,
              "discoveredComboCount": 6,
              "requiredSingleCount": 6,
              "quoteSuccessCount": 10,
              "eligibleComboCount": 3,
              "quoteFailureCount": 0,
              "missingPriceCount": 2,
              "fullStoreCoverageRatio": 0.5,
              "summaryText": "已发现 6 个套餐，其中 3 个可比；所需单品规格 6 个，成功报价 10 个，失败 0 个，缺价 2 个"
            },
            "observedRange": {
              "start": "2026-10-16T04:00:00.000Z",
              "end": "2026-10-16T04:00:00.000Z",
              "display": "2026-10-16 12:00"
            },
            "validityState": "unknown"
          },
          "displayState": "current_snapshot",
          "isStale": false,
          "note": "有效期未知，仅为报价时点结果",
          "noteLevel": "warn",
          "activeStatus": null
        },
        "detailSources": {
          "current": {
            "batchId": "batch-current-01",
            "status": "completed",
            "ranking": [
              {
                "id": "demo-combo-nuggets",
                "comboVariantId": "demo-combo-v3",
                "name": "演示套餐·鸡块",
                "configId": "demo-config-nuggets-v1",
                "P": 1990,
                "D": 3500,
                "A": 1510,
                "ratio": {
                  "num": 1990,
                  "den": 3500
                },
                "display": {
                  "discountText": "5.7折",
                  "savedPercentText": "节省43.1%",
                  "savedAmountText": "少花¥15.10",
                  "comparisonText": null,
                  "ratioText": "1990/3500"
                },
                "compositionSummary": "演示鸡块(5块装)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 1
              },
              {
                "id": "demo-combo-basic",
                "comboVariantId": "demo-combo-v1",
                "name": "演示套餐·基础",
                "configId": "demo-config-basic-v1",
                "P": 2760,
                "D": 4600,
                "A": 1840,
                "ratio": {
                  "num": 2760,
                  "den": 4600
                },
                "display": {
                  "discountText": "6.0折",
                  "savedPercentText": "节省40%",
                  "savedAmountText": "少花¥18.40",
                  "comparisonText": null,
                  "ratioText": "2760/4600"
                },
                "compositionSummary": "演示汉堡(中份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 2
              },
              {
                "id": "demo-combo-large",
                "comboVariantId": "demo-combo-v2",
                "name": "演示套餐·大份",
                "configId": "demo-config-large-v1",
                "P": 3600,
                "D": 5400,
                "A": 1800,
                "ratio": {
                  "num": 3600,
                  "den": 5400
                },
                "display": {
                  "discountText": "6.7折",
                  "savedPercentText": "节省33.3%",
                  "savedAmountText": "少花¥18.00",
                  "comparisonText": null,
                  "ratioText": "3600/5400"
                },
                "compositionSummary": "演示汉堡(大份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 3
              }
            ],
            "notComparable": [
              {
                "id": "demo-combo-sweet",
                "comboVariantId": "demo-combo-v4",
                "name": "演示套餐·甜品",
                "configId": "demo-config-sweet-v1",
                "P": 1500,
                "D": null,
                "reasons": [
                  "COMPONENT_PRICE_MISSING"
                ],
                "reasonText": "COMPONENT_PRICE_MISSING"
              },
              {
                "id": "demo-combo-limited",
                "comboVariantId": "demo-combo-v6",
                "name": "演示套餐·限时",
                "configId": "demo-config-limited-v1",
                "P": 2880,
                "D": 3400,
                "reasons": [
                  "SALE_NOT_AVAILABLE"
                ],
                "reasonText": "SALE_NOT_AVAILABLE"
              },
              {
                "id": "demo-combo-holiday",
                "comboVariantId": "demo-combo-v5",
                "name": "演示套餐·节日限定",
                "configId": null,
                "P": null,
                "D": 0,
                "reasons": [
                  "DEFAULT_CONFIG_UNKNOWN",
                  "AMOUNT_MISSING",
                  "DENOMINATOR_NOT_POSITIVE"
                ],
                "reasonText": "DEFAULT_CONFIG_UNKNOWN、AMOUNT_MISSING、DENOMINATOR_NOT_POSITIVE"
              }
            ],
            "coverage": {
              "catalogComplete": true,
              "discoveredComboCount": 6,
              "requiredSingleCount": 6,
              "quoteSuccessCount": 10,
              "eligibleComboCount": 3,
              "quoteFailureCount": 0,
              "missingPriceCount": 2,
              "fullStoreCoverageRatio": 0.5,
              "summaryText": "已发现 6 个套餐，其中 3 个可比；所需单品规格 6 个，成功报价 10 个，失败 0 个，缺价 2 个"
            },
            "observedRange": {
              "start": "2026-10-16T04:00:00.000Z",
              "end": "2026-10-16T04:00:00.000Z",
              "display": "2026-10-16 12:00"
            },
            "validityState": "unknown"
          },
          "previous": {
            "batchId": "batch-previous-01",
            "status": "completed",
            "ranking": [
              {
                "id": "demo-combo-nuggets",
                "comboVariantId": "demo-combo-v3",
                "name": "演示套餐·鸡块",
                "configId": "demo-config-nuggets-v1",
                "P": 1990,
                "D": 3500,
                "A": 1510,
                "ratio": {
                  "num": 1990,
                  "den": 3500
                },
                "display": {
                  "discountText": "5.7折",
                  "savedPercentText": "节省43.1%",
                  "savedAmountText": "少花¥15.10",
                  "comparisonText": null,
                  "ratioText": "1990/3500"
                },
                "compositionSummary": "演示鸡块(5块装)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 1
              },
              {
                "id": "demo-combo-basic",
                "comboVariantId": "demo-combo-v1",
                "name": "演示套餐·基础",
                "configId": "demo-config-basic-v1",
                "P": 2760,
                "D": 4600,
                "A": 1840,
                "ratio": {
                  "num": 2760,
                  "den": 4600
                },
                "display": {
                  "discountText": "6.0折",
                  "savedPercentText": "节省40%",
                  "savedAmountText": "少花¥18.40",
                  "comparisonText": null,
                  "ratioText": "2760/4600"
                },
                "compositionSummary": "演示汉堡(中份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 2
              },
              {
                "id": "demo-combo-large",
                "comboVariantId": "demo-combo-v2",
                "name": "演示套餐·大份",
                "configId": "demo-config-large-v1",
                "P": 3600,
                "D": 5400,
                "A": 1800,
                "ratio": {
                  "num": 3600,
                  "den": 5400
                },
                "display": {
                  "discountText": "6.7折",
                  "savedPercentText": "节省33.3%",
                  "savedAmountText": "少花¥18.00",
                  "comparisonText": null,
                  "ratioText": "3600/5400"
                },
                "compositionSummary": "演示汉堡(大份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 3
              }
            ],
            "notComparable": [
              {
                "id": "demo-combo-sweet",
                "comboVariantId": "demo-combo-v4",
                "name": "演示套餐·甜品",
                "configId": "demo-config-sweet-v1",
                "P": 1500,
                "D": null,
                "reasons": [
                  "COMPONENT_PRICE_MISSING"
                ],
                "reasonText": "COMPONENT_PRICE_MISSING"
              },
              {
                "id": "demo-combo-limited",
                "comboVariantId": "demo-combo-v6",
                "name": "演示套餐·限时",
                "configId": "demo-config-limited-v1",
                "P": 2880,
                "D": 3400,
                "reasons": [
                  "SALE_NOT_AVAILABLE"
                ],
                "reasonText": "SALE_NOT_AVAILABLE"
              },
              {
                "id": "demo-combo-holiday",
                "comboVariantId": "demo-combo-v5",
                "name": "演示套餐·节日限定",
                "configId": null,
                "P": null,
                "D": 0,
                "reasons": [
                  "DEFAULT_CONFIG_UNKNOWN",
                  "AMOUNT_MISSING",
                  "DENOMINATOR_NOT_POSITIVE"
                ],
                "reasonText": "DEFAULT_CONFIG_UNKNOWN、AMOUNT_MISSING、DENOMINATOR_NOT_POSITIVE"
              }
            ],
            "coverage": {
              "catalogComplete": true,
              "discoveredComboCount": 6,
              "requiredSingleCount": 6,
              "quoteSuccessCount": 10,
              "eligibleComboCount": 3,
              "quoteFailureCount": 0,
              "missingPriceCount": 2,
              "fullStoreCoverageRatio": 0.5,
              "summaryText": "已发现 6 个套餐，其中 3 个可比；所需单品规格 6 个，成功报价 10 个，失败 0 个，缺价 2 个"
            },
            "observedRange": {
              "start": "2026-10-16T01:30:00.000Z",
              "end": "2026-10-16T01:30:00.000Z",
              "display": "2026-10-16 09:30"
            },
            "validityState": "unknown"
          }
        }
      }
    },
    "delivery": {
      "contextVersion": "ctx-delivery-demo@v1",
      "storeName": "演示店·麦乐送",
      "addressAlias": "演示地址A",
      "deliveryFeeCents": 600,
      "minOrderCents": 2000,
      "scenarios": {
        "normal": {
          "published": {
            "batchId": "batch-current-01",
            "status": "completed",
            "ranking": [
              {
                "id": "demo-combo-nuggets",
                "comboVariantId": "demo-combo-v3",
                "name": "演示套餐·鸡块",
                "configId": "demo-config-nuggets-v1",
                "P": 2150,
                "D": 3800,
                "A": 1650,
                "ratio": {
                  "num": 2150,
                  "den": 3800
                },
                "display": {
                  "discountText": "5.7折",
                  "savedPercentText": "节省43.4%",
                  "savedAmountText": "少花¥16.50",
                  "comparisonText": null,
                  "ratioText": "2150/3800"
                },
                "compositionSummary": "演示鸡块(5块装)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 1
              },
              {
                "id": "demo-combo-basic",
                "comboVariantId": "demo-combo-v1",
                "name": "演示套餐·基础",
                "configId": "demo-config-basic-v1",
                "P": 2990,
                "D": 5000,
                "A": 2010,
                "ratio": {
                  "num": 2990,
                  "den": 5000
                },
                "display": {
                  "discountText": "6.0折",
                  "savedPercentText": "节省40.2%",
                  "savedAmountText": "少花¥20.10",
                  "comparisonText": null,
                  "ratioText": "2990/5000"
                },
                "compositionSummary": "演示汉堡(中份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 2
              },
              {
                "id": "demo-combo-large",
                "comboVariantId": "demo-combo-v2",
                "name": "演示套餐·大份",
                "configId": "demo-config-large-v1",
                "P": 3900,
                "D": 5800,
                "A": 1900,
                "ratio": {
                  "num": 3900,
                  "den": 5800
                },
                "display": {
                  "discountText": "6.7折",
                  "savedPercentText": "节省32.8%",
                  "savedAmountText": "少花¥19.00",
                  "comparisonText": null,
                  "ratioText": "3900/5800"
                },
                "compositionSummary": "演示汉堡(大份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 3
              }
            ],
            "notComparable": [
              {
                "id": "demo-combo-sweet",
                "comboVariantId": "demo-combo-v4",
                "name": "演示套餐·甜品",
                "configId": "demo-config-sweet-v1",
                "P": 1600,
                "D": 2100,
                "reasons": [
                  "FEE_NOT_SEPARABLE"
                ],
                "reasonText": "FEE_NOT_SEPARABLE"
              },
              {
                "id": "demo-combo-limited",
                "comboVariantId": "demo-combo-v6",
                "name": "演示套餐·限时",
                "configId": "demo-config-limited-v1",
                "P": 3080,
                "D": 3700,
                "reasons": [
                  "SALE_NOT_AVAILABLE"
                ],
                "reasonText": "SALE_NOT_AVAILABLE"
              },
              {
                "id": "demo-combo-holiday",
                "comboVariantId": "demo-combo-v5",
                "name": "演示套餐·节日限定",
                "configId": null,
                "P": null,
                "D": 0,
                "reasons": [
                  "DEFAULT_CONFIG_UNKNOWN",
                  "AMOUNT_MISSING",
                  "DENOMINATOR_NOT_POSITIVE"
                ],
                "reasonText": "DEFAULT_CONFIG_UNKNOWN、AMOUNT_MISSING、DENOMINATOR_NOT_POSITIVE"
              }
            ],
            "coverage": {
              "catalogComplete": true,
              "discoveredComboCount": 6,
              "requiredSingleCount": 6,
              "quoteSuccessCount": 11,
              "eligibleComboCount": 3,
              "quoteFailureCount": 0,
              "missingPriceCount": 1,
              "fullStoreCoverageRatio": 0.5,
              "summaryText": "已发现 6 个套餐，其中 3 个可比；所需单品规格 6 个，成功报价 11 个，失败 0 个，缺价 1 个"
            },
            "observedRange": {
              "start": "2026-10-16T04:00:00.000Z",
              "end": "2026-10-16T04:00:00.000Z",
              "display": "2026-10-16 12:00"
            },
            "validityState": "unknown"
          },
          "displayState": "current_snapshot",
          "isStale": false,
          "note": "本次结果已发布",
          "noteLevel": "info",
          "activeStatus": null
        },
        "empty": {
          "published": null,
          "displayState": "empty",
          "isStale": false,
          "note": null,
          "noteLevel": null,
          "activeStatus": null
        },
        "updating": {
          "published": {
            "batchId": "batch-previous-01",
            "status": "completed",
            "ranking": [
              {
                "id": "demo-combo-nuggets",
                "comboVariantId": "demo-combo-v3",
                "name": "演示套餐·鸡块",
                "configId": "demo-config-nuggets-v1",
                "P": 2150,
                "D": 3800,
                "A": 1650,
                "ratio": {
                  "num": 2150,
                  "den": 3800
                },
                "display": {
                  "discountText": "5.7折",
                  "savedPercentText": "节省43.4%",
                  "savedAmountText": "少花¥16.50",
                  "comparisonText": null,
                  "ratioText": "2150/3800"
                },
                "compositionSummary": "演示鸡块(5块装)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 1
              },
              {
                "id": "demo-combo-basic",
                "comboVariantId": "demo-combo-v1",
                "name": "演示套餐·基础",
                "configId": "demo-config-basic-v1",
                "P": 2990,
                "D": 5000,
                "A": 2010,
                "ratio": {
                  "num": 2990,
                  "den": 5000
                },
                "display": {
                  "discountText": "6.0折",
                  "savedPercentText": "节省40.2%",
                  "savedAmountText": "少花¥20.10",
                  "comparisonText": null,
                  "ratioText": "2990/5000"
                },
                "compositionSummary": "演示汉堡(中份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 2
              },
              {
                "id": "demo-combo-large",
                "comboVariantId": "demo-combo-v2",
                "name": "演示套餐·大份",
                "configId": "demo-config-large-v1",
                "P": 3900,
                "D": 5800,
                "A": 1900,
                "ratio": {
                  "num": 3900,
                  "den": 5800
                },
                "display": {
                  "discountText": "6.7折",
                  "savedPercentText": "节省32.8%",
                  "savedAmountText": "少花¥19.00",
                  "comparisonText": null,
                  "ratioText": "3900/5800"
                },
                "compositionSummary": "演示汉堡(大份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 3
              }
            ],
            "notComparable": [
              {
                "id": "demo-combo-sweet",
                "comboVariantId": "demo-combo-v4",
                "name": "演示套餐·甜品",
                "configId": "demo-config-sweet-v1",
                "P": 1600,
                "D": 2100,
                "reasons": [
                  "FEE_NOT_SEPARABLE"
                ],
                "reasonText": "FEE_NOT_SEPARABLE"
              },
              {
                "id": "demo-combo-limited",
                "comboVariantId": "demo-combo-v6",
                "name": "演示套餐·限时",
                "configId": "demo-config-limited-v1",
                "P": 3080,
                "D": 3700,
                "reasons": [
                  "SALE_NOT_AVAILABLE"
                ],
                "reasonText": "SALE_NOT_AVAILABLE"
              },
              {
                "id": "demo-combo-holiday",
                "comboVariantId": "demo-combo-v5",
                "name": "演示套餐·节日限定",
                "configId": null,
                "P": null,
                "D": 0,
                "reasons": [
                  "DEFAULT_CONFIG_UNKNOWN",
                  "AMOUNT_MISSING",
                  "DENOMINATOR_NOT_POSITIVE"
                ],
                "reasonText": "DEFAULT_CONFIG_UNKNOWN、AMOUNT_MISSING、DENOMINATOR_NOT_POSITIVE"
              }
            ],
            "coverage": {
              "catalogComplete": true,
              "discoveredComboCount": 6,
              "requiredSingleCount": 6,
              "quoteSuccessCount": 11,
              "eligibleComboCount": 3,
              "quoteFailureCount": 0,
              "missingPriceCount": 1,
              "fullStoreCoverageRatio": 0.5,
              "summaryText": "已发现 6 个套餐，其中 3 个可比；所需单品规格 6 个，成功报价 11 个，失败 0 个，缺价 1 个"
            },
            "observedRange": {
              "start": "2026-10-16T01:30:00.000Z",
              "end": "2026-10-16T01:30:00.000Z",
              "display": "2026-10-16 09:30"
            },
            "validityState": "unknown"
          },
          "displayState": "previous_result",
          "isStale": true,
          "note": "更新进行中，以下仍为上次已发布结果",
          "noteLevel": "info",
          "activeStatus": "running"
        },
        "partial": {
          "published": {
            "batchId": "batch-partial-01",
            "status": "partial",
            "ranking": [
              {
                "id": "demo-combo-nuggets",
                "comboVariantId": "demo-combo-v3",
                "name": "演示套餐·鸡块",
                "configId": "demo-config-nuggets-v1",
                "P": 2150,
                "D": 3800,
                "A": 1650,
                "ratio": {
                  "num": 2150,
                  "den": 3800
                },
                "display": {
                  "discountText": "5.7折",
                  "savedPercentText": "节省43.4%",
                  "savedAmountText": "少花¥16.50",
                  "comparisonText": null,
                  "ratioText": "2150/3800"
                },
                "compositionSummary": "演示鸡块(5块装)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 1
              },
              {
                "id": "demo-combo-basic",
                "comboVariantId": "demo-combo-v1",
                "name": "演示套餐·基础",
                "configId": "demo-config-basic-v1",
                "P": 2990,
                "D": 5000,
                "A": 2010,
                "ratio": {
                  "num": 2990,
                  "den": 5000
                },
                "display": {
                  "discountText": "6.0折",
                  "savedPercentText": "节省40.2%",
                  "savedAmountText": "少花¥20.10",
                  "comparisonText": null,
                  "ratioText": "2990/5000"
                },
                "compositionSummary": "演示汉堡(中份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 2
              },
              {
                "id": "demo-combo-large",
                "comboVariantId": "demo-combo-v2",
                "name": "演示套餐·大份",
                "configId": "demo-config-large-v1",
                "P": 3900,
                "D": 5800,
                "A": 1900,
                "ratio": {
                  "num": 3900,
                  "den": 5800
                },
                "display": {
                  "discountText": "6.7折",
                  "savedPercentText": "节省32.8%",
                  "savedAmountText": "少花¥19.00",
                  "comparisonText": null,
                  "ratioText": "3900/5800"
                },
                "compositionSummary": "演示汉堡(大份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 3
              }
            ],
            "notComparable": [
              {
                "id": "demo-combo-sweet",
                "comboVariantId": "demo-combo-v4",
                "name": "演示套餐·甜品",
                "configId": "demo-config-sweet-v1",
                "P": 1600,
                "D": 2100,
                "reasons": [
                  "FEE_NOT_SEPARABLE"
                ],
                "reasonText": "FEE_NOT_SEPARABLE"
              },
              {
                "id": "demo-combo-limited",
                "comboVariantId": "demo-combo-v6",
                "name": "演示套餐·限时",
                "configId": "demo-config-limited-v1",
                "P": 3080,
                "D": 3700,
                "reasons": [
                  "SALE_NOT_AVAILABLE"
                ],
                "reasonText": "SALE_NOT_AVAILABLE"
              },
              {
                "id": "demo-combo-holiday",
                "comboVariantId": "demo-combo-v5",
                "name": "演示套餐·节日限定",
                "configId": null,
                "P": null,
                "D": 0,
                "reasons": [
                  "DEFAULT_CONFIG_UNKNOWN",
                  "AMOUNT_MISSING",
                  "DENOMINATOR_NOT_POSITIVE"
                ],
                "reasonText": "DEFAULT_CONFIG_UNKNOWN、AMOUNT_MISSING、DENOMINATOR_NOT_POSITIVE"
              }
            ],
            "coverage": {
              "catalogComplete": false,
              "discoveredComboCount": 6,
              "requiredSingleCount": 6,
              "quoteSuccessCount": 11,
              "eligibleComboCount": 3,
              "quoteFailureCount": 0,
              "missingPriceCount": 1,
              "fullStoreCoverageRatio": null,
              "summaryText": "已发现 6 个套餐，其中 3 个可比；所需单品规格 6 个，成功报价 11 个，失败 0 个，缺价 1 个"
            },
            "observedRange": {
              "start": "2026-10-16T04:00:00.000Z",
              "end": "2026-10-16T04:00:00.000Z",
              "display": "2026-10-16 12:00"
            },
            "validityState": "unknown"
          },
          "displayState": "current_snapshot",
          "isStale": false,
          "note": "本次为局部结果，目录不完整",
          "noteLevel": "warn",
          "activeStatus": null
        },
        "failed_keep_previous": {
          "published": {
            "batchId": "batch-previous-01",
            "status": "completed",
            "ranking": [
              {
                "id": "demo-combo-nuggets",
                "comboVariantId": "demo-combo-v3",
                "name": "演示套餐·鸡块",
                "configId": "demo-config-nuggets-v1",
                "P": 2150,
                "D": 3800,
                "A": 1650,
                "ratio": {
                  "num": 2150,
                  "den": 3800
                },
                "display": {
                  "discountText": "5.7折",
                  "savedPercentText": "节省43.4%",
                  "savedAmountText": "少花¥16.50",
                  "comparisonText": null,
                  "ratioText": "2150/3800"
                },
                "compositionSummary": "演示鸡块(5块装)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 1
              },
              {
                "id": "demo-combo-basic",
                "comboVariantId": "demo-combo-v1",
                "name": "演示套餐·基础",
                "configId": "demo-config-basic-v1",
                "P": 2990,
                "D": 5000,
                "A": 2010,
                "ratio": {
                  "num": 2990,
                  "den": 5000
                },
                "display": {
                  "discountText": "6.0折",
                  "savedPercentText": "节省40.2%",
                  "savedAmountText": "少花¥20.10",
                  "comparisonText": null,
                  "ratioText": "2990/5000"
                },
                "compositionSummary": "演示汉堡(中份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 2
              },
              {
                "id": "demo-combo-large",
                "comboVariantId": "demo-combo-v2",
                "name": "演示套餐·大份",
                "configId": "demo-config-large-v1",
                "P": 3900,
                "D": 5800,
                "A": 1900,
                "ratio": {
                  "num": 3900,
                  "den": 5800
                },
                "display": {
                  "discountText": "6.7折",
                  "savedPercentText": "节省32.8%",
                  "savedAmountText": "少花¥19.00",
                  "comparisonText": null,
                  "ratioText": "3900/5800"
                },
                "compositionSummary": "演示汉堡(大份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 3
              }
            ],
            "notComparable": [
              {
                "id": "demo-combo-sweet",
                "comboVariantId": "demo-combo-v4",
                "name": "演示套餐·甜品",
                "configId": "demo-config-sweet-v1",
                "P": 1600,
                "D": 2100,
                "reasons": [
                  "FEE_NOT_SEPARABLE"
                ],
                "reasonText": "FEE_NOT_SEPARABLE"
              },
              {
                "id": "demo-combo-limited",
                "comboVariantId": "demo-combo-v6",
                "name": "演示套餐·限时",
                "configId": "demo-config-limited-v1",
                "P": 3080,
                "D": 3700,
                "reasons": [
                  "SALE_NOT_AVAILABLE"
                ],
                "reasonText": "SALE_NOT_AVAILABLE"
              },
              {
                "id": "demo-combo-holiday",
                "comboVariantId": "demo-combo-v5",
                "name": "演示套餐·节日限定",
                "configId": null,
                "P": null,
                "D": 0,
                "reasons": [
                  "DEFAULT_CONFIG_UNKNOWN",
                  "AMOUNT_MISSING",
                  "DENOMINATOR_NOT_POSITIVE"
                ],
                "reasonText": "DEFAULT_CONFIG_UNKNOWN、AMOUNT_MISSING、DENOMINATOR_NOT_POSITIVE"
              }
            ],
            "coverage": {
              "catalogComplete": true,
              "discoveredComboCount": 6,
              "requiredSingleCount": 6,
              "quoteSuccessCount": 11,
              "eligibleComboCount": 3,
              "quoteFailureCount": 0,
              "missingPriceCount": 1,
              "fullStoreCoverageRatio": 0.5,
              "summaryText": "已发现 6 个套餐，其中 3 个可比；所需单品规格 6 个，成功报价 11 个，失败 0 个，缺价 1 个"
            },
            "observedRange": {
              "start": "2026-10-16T01:30:00.000Z",
              "end": "2026-10-16T01:30:00.000Z",
              "display": "2026-10-16 09:30"
            },
            "validityState": "unknown"
          },
          "displayState": "previous_result",
          "isStale": false,
          "note": "本次更新失败/未执行，以下为上次结果",
          "noteLevel": "warn",
          "activeStatus": null
        },
        "failed_no_previous": {
          "published": null,
          "displayState": "empty",
          "isStale": false,
          "note": "本次更新失败/未执行，暂无历史结果",
          "noteLevel": "warn",
          "activeStatus": null
        },
        "expired": {
          "published": {
            "batchId": "batch-current-01",
            "status": "completed",
            "ranking": [
              {
                "id": "demo-combo-nuggets",
                "comboVariantId": "demo-combo-v3",
                "name": "演示套餐·鸡块",
                "configId": "demo-config-nuggets-v1",
                "P": 2150,
                "D": 3800,
                "A": 1650,
                "ratio": {
                  "num": 2150,
                  "den": 3800
                },
                "display": {
                  "discountText": "5.7折",
                  "savedPercentText": "节省43.4%",
                  "savedAmountText": "少花¥16.50",
                  "comparisonText": null,
                  "ratioText": "2150/3800"
                },
                "compositionSummary": "演示鸡块(5块装)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 1
              },
              {
                "id": "demo-combo-basic",
                "comboVariantId": "demo-combo-v1",
                "name": "演示套餐·基础",
                "configId": "demo-config-basic-v1",
                "P": 2990,
                "D": 5000,
                "A": 2010,
                "ratio": {
                  "num": 2990,
                  "den": 5000
                },
                "display": {
                  "discountText": "6.0折",
                  "savedPercentText": "节省40.2%",
                  "savedAmountText": "少花¥20.10",
                  "comparisonText": null,
                  "ratioText": "2990/5000"
                },
                "compositionSummary": "演示汉堡(中份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 2
              },
              {
                "id": "demo-combo-large",
                "comboVariantId": "demo-combo-v2",
                "name": "演示套餐·大份",
                "configId": "demo-config-large-v1",
                "P": 3900,
                "D": 5800,
                "A": 1900,
                "ratio": {
                  "num": 3900,
                  "den": 5800
                },
                "display": {
                  "discountText": "6.7折",
                  "savedPercentText": "节省32.8%",
                  "savedAmountText": "少花¥19.00",
                  "comparisonText": null,
                  "ratioText": "3900/5800"
                },
                "compositionSummary": "演示汉堡(大份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 3
              }
            ],
            "notComparable": [
              {
                "id": "demo-combo-sweet",
                "comboVariantId": "demo-combo-v4",
                "name": "演示套餐·甜品",
                "configId": "demo-config-sweet-v1",
                "P": 1600,
                "D": 2100,
                "reasons": [
                  "FEE_NOT_SEPARABLE"
                ],
                "reasonText": "FEE_NOT_SEPARABLE"
              },
              {
                "id": "demo-combo-limited",
                "comboVariantId": "demo-combo-v6",
                "name": "演示套餐·限时",
                "configId": "demo-config-limited-v1",
                "P": 3080,
                "D": 3700,
                "reasons": [
                  "SALE_NOT_AVAILABLE"
                ],
                "reasonText": "SALE_NOT_AVAILABLE"
              },
              {
                "id": "demo-combo-holiday",
                "comboVariantId": "demo-combo-v5",
                "name": "演示套餐·节日限定",
                "configId": null,
                "P": null,
                "D": 0,
                "reasons": [
                  "DEFAULT_CONFIG_UNKNOWN",
                  "AMOUNT_MISSING",
                  "DENOMINATOR_NOT_POSITIVE"
                ],
                "reasonText": "DEFAULT_CONFIG_UNKNOWN、AMOUNT_MISSING、DENOMINATOR_NOT_POSITIVE"
              }
            ],
            "coverage": {
              "catalogComplete": true,
              "discoveredComboCount": 6,
              "requiredSingleCount": 6,
              "quoteSuccessCount": 11,
              "eligibleComboCount": 3,
              "quoteFailureCount": 0,
              "missingPriceCount": 1,
              "fullStoreCoverageRatio": 0.5,
              "summaryText": "已发现 6 个套餐，其中 3 个可比；所需单品规格 6 个，成功报价 11 个，失败 0 个，缺价 1 个"
            },
            "observedRange": {
              "start": "2026-10-16T04:00:00.000Z",
              "end": "2026-10-16T04:00:00.000Z",
              "display": "2026-10-16 12:00"
            },
            "validityState": "expired"
          },
          "displayState": "current_snapshot",
          "isStale": false,
          "note": "报价已过期，请手动更新榜单",
          "noteLevel": "warn",
          "activeStatus": null
        },
        "validity_unknown": {
          "published": {
            "batchId": "batch-current-01",
            "status": "completed",
            "ranking": [
              {
                "id": "demo-combo-nuggets",
                "comboVariantId": "demo-combo-v3",
                "name": "演示套餐·鸡块",
                "configId": "demo-config-nuggets-v1",
                "P": 2150,
                "D": 3800,
                "A": 1650,
                "ratio": {
                  "num": 2150,
                  "den": 3800
                },
                "display": {
                  "discountText": "5.7折",
                  "savedPercentText": "节省43.4%",
                  "savedAmountText": "少花¥16.50",
                  "comparisonText": null,
                  "ratioText": "2150/3800"
                },
                "compositionSummary": "演示鸡块(5块装)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 1
              },
              {
                "id": "demo-combo-basic",
                "comboVariantId": "demo-combo-v1",
                "name": "演示套餐·基础",
                "configId": "demo-config-basic-v1",
                "P": 2990,
                "D": 5000,
                "A": 2010,
                "ratio": {
                  "num": 2990,
                  "den": 5000
                },
                "display": {
                  "discountText": "6.0折",
                  "savedPercentText": "节省40.2%",
                  "savedAmountText": "少花¥20.10",
                  "comparisonText": null,
                  "ratioText": "2990/5000"
                },
                "compositionSummary": "演示汉堡(中份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 2
              },
              {
                "id": "demo-combo-large",
                "comboVariantId": "demo-combo-v2",
                "name": "演示套餐·大份",
                "configId": "demo-config-large-v1",
                "P": 3900,
                "D": 5800,
                "A": 1900,
                "ratio": {
                  "num": 3900,
                  "den": 5800
                },
                "display": {
                  "discountText": "6.7折",
                  "savedPercentText": "节省32.8%",
                  "savedAmountText": "少花¥19.00",
                  "comparisonText": null,
                  "ratioText": "3900/5800"
                },
                "compositionSummary": "演示汉堡(大份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 3
              }
            ],
            "notComparable": [
              {
                "id": "demo-combo-sweet",
                "comboVariantId": "demo-combo-v4",
                "name": "演示套餐·甜品",
                "configId": "demo-config-sweet-v1",
                "P": 1600,
                "D": 2100,
                "reasons": [
                  "FEE_NOT_SEPARABLE"
                ],
                "reasonText": "FEE_NOT_SEPARABLE"
              },
              {
                "id": "demo-combo-limited",
                "comboVariantId": "demo-combo-v6",
                "name": "演示套餐·限时",
                "configId": "demo-config-limited-v1",
                "P": 3080,
                "D": 3700,
                "reasons": [
                  "SALE_NOT_AVAILABLE"
                ],
                "reasonText": "SALE_NOT_AVAILABLE"
              },
              {
                "id": "demo-combo-holiday",
                "comboVariantId": "demo-combo-v5",
                "name": "演示套餐·节日限定",
                "configId": null,
                "P": null,
                "D": 0,
                "reasons": [
                  "DEFAULT_CONFIG_UNKNOWN",
                  "AMOUNT_MISSING",
                  "DENOMINATOR_NOT_POSITIVE"
                ],
                "reasonText": "DEFAULT_CONFIG_UNKNOWN、AMOUNT_MISSING、DENOMINATOR_NOT_POSITIVE"
              }
            ],
            "coverage": {
              "catalogComplete": true,
              "discoveredComboCount": 6,
              "requiredSingleCount": 6,
              "quoteSuccessCount": 11,
              "eligibleComboCount": 3,
              "quoteFailureCount": 0,
              "missingPriceCount": 1,
              "fullStoreCoverageRatio": 0.5,
              "summaryText": "已发现 6 个套餐，其中 3 个可比；所需单品规格 6 个，成功报价 11 个，失败 0 个，缺价 1 个"
            },
            "observedRange": {
              "start": "2026-10-16T04:00:00.000Z",
              "end": "2026-10-16T04:00:00.000Z",
              "display": "2026-10-16 12:00"
            },
            "validityState": "unknown"
          },
          "displayState": "current_snapshot",
          "isStale": false,
          "note": "有效期未知，仅为报价时点结果",
          "noteLevel": "warn",
          "activeStatus": null
        },
        "detailSources": {
          "current": {
            "batchId": "batch-current-01",
            "status": "completed",
            "ranking": [
              {
                "id": "demo-combo-nuggets",
                "comboVariantId": "demo-combo-v3",
                "name": "演示套餐·鸡块",
                "configId": "demo-config-nuggets-v1",
                "P": 2150,
                "D": 3800,
                "A": 1650,
                "ratio": {
                  "num": 2150,
                  "den": 3800
                },
                "display": {
                  "discountText": "5.7折",
                  "savedPercentText": "节省43.4%",
                  "savedAmountText": "少花¥16.50",
                  "comparisonText": null,
                  "ratioText": "2150/3800"
                },
                "compositionSummary": "演示鸡块(5块装)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 1
              },
              {
                "id": "demo-combo-basic",
                "comboVariantId": "demo-combo-v1",
                "name": "演示套餐·基础",
                "configId": "demo-config-basic-v1",
                "P": 2990,
                "D": 5000,
                "A": 2010,
                "ratio": {
                  "num": 2990,
                  "den": 5000
                },
                "display": {
                  "discountText": "6.0折",
                  "savedPercentText": "节省40.2%",
                  "savedAmountText": "少花¥20.10",
                  "comparisonText": null,
                  "ratioText": "2990/5000"
                },
                "compositionSummary": "演示汉堡(中份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 2
              },
              {
                "id": "demo-combo-large",
                "comboVariantId": "demo-combo-v2",
                "name": "演示套餐·大份",
                "configId": "demo-config-large-v1",
                "P": 3900,
                "D": 5800,
                "A": 1900,
                "ratio": {
                  "num": 3900,
                  "den": 5800
                },
                "display": {
                  "discountText": "6.7折",
                  "savedPercentText": "节省32.8%",
                  "savedAmountText": "少花¥19.00",
                  "comparisonText": null,
                  "ratioText": "3900/5800"
                },
                "compositionSummary": "演示汉堡(大份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 3
              }
            ],
            "notComparable": [
              {
                "id": "demo-combo-sweet",
                "comboVariantId": "demo-combo-v4",
                "name": "演示套餐·甜品",
                "configId": "demo-config-sweet-v1",
                "P": 1600,
                "D": 2100,
                "reasons": [
                  "FEE_NOT_SEPARABLE"
                ],
                "reasonText": "FEE_NOT_SEPARABLE"
              },
              {
                "id": "demo-combo-limited",
                "comboVariantId": "demo-combo-v6",
                "name": "演示套餐·限时",
                "configId": "demo-config-limited-v1",
                "P": 3080,
                "D": 3700,
                "reasons": [
                  "SALE_NOT_AVAILABLE"
                ],
                "reasonText": "SALE_NOT_AVAILABLE"
              },
              {
                "id": "demo-combo-holiday",
                "comboVariantId": "demo-combo-v5",
                "name": "演示套餐·节日限定",
                "configId": null,
                "P": null,
                "D": 0,
                "reasons": [
                  "DEFAULT_CONFIG_UNKNOWN",
                  "AMOUNT_MISSING",
                  "DENOMINATOR_NOT_POSITIVE"
                ],
                "reasonText": "DEFAULT_CONFIG_UNKNOWN、AMOUNT_MISSING、DENOMINATOR_NOT_POSITIVE"
              }
            ],
            "coverage": {
              "catalogComplete": true,
              "discoveredComboCount": 6,
              "requiredSingleCount": 6,
              "quoteSuccessCount": 11,
              "eligibleComboCount": 3,
              "quoteFailureCount": 0,
              "missingPriceCount": 1,
              "fullStoreCoverageRatio": 0.5,
              "summaryText": "已发现 6 个套餐，其中 3 个可比；所需单品规格 6 个，成功报价 11 个，失败 0 个，缺价 1 个"
            },
            "observedRange": {
              "start": "2026-10-16T04:00:00.000Z",
              "end": "2026-10-16T04:00:00.000Z",
              "display": "2026-10-16 12:00"
            },
            "validityState": "unknown"
          },
          "previous": {
            "batchId": "batch-previous-01",
            "status": "completed",
            "ranking": [
              {
                "id": "demo-combo-nuggets",
                "comboVariantId": "demo-combo-v3",
                "name": "演示套餐·鸡块",
                "configId": "demo-config-nuggets-v1",
                "P": 2150,
                "D": 3800,
                "A": 1650,
                "ratio": {
                  "num": 2150,
                  "den": 3800
                },
                "display": {
                  "discountText": "5.7折",
                  "savedPercentText": "节省43.4%",
                  "savedAmountText": "少花¥16.50",
                  "comparisonText": null,
                  "ratioText": "2150/3800"
                },
                "compositionSummary": "演示鸡块(5块装)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 1
              },
              {
                "id": "demo-combo-basic",
                "comboVariantId": "demo-combo-v1",
                "name": "演示套餐·基础",
                "configId": "demo-config-basic-v1",
                "P": 2990,
                "D": 5000,
                "A": 2010,
                "ratio": {
                  "num": 2990,
                  "den": 5000
                },
                "display": {
                  "discountText": "6.0折",
                  "savedPercentText": "节省40.2%",
                  "savedAmountText": "少花¥20.10",
                  "comparisonText": null,
                  "ratioText": "2990/5000"
                },
                "compositionSummary": "演示汉堡(中份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 2
              },
              {
                "id": "demo-combo-large",
                "comboVariantId": "demo-combo-v2",
                "name": "演示套餐·大份",
                "configId": "demo-config-large-v1",
                "P": 3900,
                "D": 5800,
                "A": 1900,
                "ratio": {
                  "num": 3900,
                  "den": 5800
                },
                "display": {
                  "discountText": "6.7折",
                  "savedPercentText": "节省32.8%",
                  "savedAmountText": "少花¥19.00",
                  "comparisonText": null,
                  "ratioText": "3900/5800"
                },
                "compositionSummary": "演示汉堡(大份)×1 + 演示薯条(中份)×1 + 演示饮料(中杯)×1",
                "rank": 3
              }
            ],
            "notComparable": [
              {
                "id": "demo-combo-sweet",
                "comboVariantId": "demo-combo-v4",
                "name": "演示套餐·甜品",
                "configId": "demo-config-sweet-v1",
                "P": 1600,
                "D": 2100,
                "reasons": [
                  "FEE_NOT_SEPARABLE"
                ],
                "reasonText": "FEE_NOT_SEPARABLE"
              },
              {
                "id": "demo-combo-limited",
                "comboVariantId": "demo-combo-v6",
                "name": "演示套餐·限时",
                "configId": "demo-config-limited-v1",
                "P": 3080,
                "D": 3700,
                "reasons": [
                  "SALE_NOT_AVAILABLE"
                ],
                "reasonText": "SALE_NOT_AVAILABLE"
              },
              {
                "id": "demo-combo-holiday",
                "comboVariantId": "demo-combo-v5",
                "name": "演示套餐·节日限定",
                "configId": null,
                "P": null,
                "D": 0,
                "reasons": [
                  "DEFAULT_CONFIG_UNKNOWN",
                  "AMOUNT_MISSING",
                  "DENOMINATOR_NOT_POSITIVE"
                ],
                "reasonText": "DEFAULT_CONFIG_UNKNOWN、AMOUNT_MISSING、DENOMINATOR_NOT_POSITIVE"
              }
            ],
            "coverage": {
              "catalogComplete": true,
              "discoveredComboCount": 6,
              "requiredSingleCount": 6,
              "quoteSuccessCount": 11,
              "eligibleComboCount": 3,
              "quoteFailureCount": 0,
              "missingPriceCount": 1,
              "fullStoreCoverageRatio": 0.5,
              "summaryText": "已发现 6 个套餐，其中 3 个可比；所需单品规格 6 个，成功报价 11 个，失败 0 个，缺价 1 个"
            },
            "observedRange": {
              "start": "2026-10-16T01:30:00.000Z",
              "end": "2026-10-16T01:30:00.000Z",
              "display": "2026-10-16 09:30"
            },
            "validityState": "unknown"
          }
        }
      }
    }
  },
  "variants": [
    {
      "id": "demo-burger-mid",
      "sourceProductRef": "SRC-BURGER-A",
      "name": "演示汉堡",
      "variantLabel": "中份",
      "independentlySold": true,
      "sourceKind": "single"
    },
    {
      "id": "demo-burger-large",
      "sourceProductRef": "SRC-BURGER-B",
      "name": "演示汉堡",
      "variantLabel": "大份",
      "independentlySold": true,
      "sourceKind": "single"
    },
    {
      "id": "demo-fries-mid",
      "sourceProductRef": "SRC-FRIES-A",
      "name": "演示薯条",
      "variantLabel": "中份",
      "independentlySold": true,
      "sourceKind": "single"
    },
    {
      "id": "demo-drink-mid",
      "sourceProductRef": "SRC-DRINK-A",
      "name": "演示饮料",
      "variantLabel": "中杯",
      "independentlySold": true,
      "sourceKind": "single"
    },
    {
      "id": "demo-nuggets-5",
      "sourceProductRef": "SRC-NUGGET-A",
      "name": "演示鸡块",
      "variantLabel": "5块装",
      "independentlySold": true,
      "sourceKind": "single"
    },
    {
      "id": "demo-dessert-1",
      "sourceProductRef": "SRC-DESSERT-A",
      "name": "演示甜品",
      "variantLabel": "1份",
      "independentlySold": true,
      "sourceKind": "single"
    }
  ],
  "comboLookup": {
    "pickup|demo-combo-basic": {
      "name": "演示套餐·基础",
      "configId": "demo-config-basic-v1",
      "components": [
        {
          "variantId": "demo-burger-mid",
          "name": "演示汉堡",
          "variantLabel": "中份",
          "quantity": 1,
          "isGift": false,
          "unitPriceCents": 2400
        },
        {
          "variantId": "demo-fries-mid",
          "name": "演示薯条",
          "variantLabel": "中份",
          "quantity": 1,
          "isGift": false,
          "unitPriceCents": 1200
        },
        {
          "variantId": "demo-drink-mid",
          "name": "演示饮料",
          "variantLabel": "中杯",
          "quantity": 1,
          "isGift": false,
          "unitPriceCents": 1000
        }
      ]
    },
    "pickup|demo-combo-large": {
      "name": "演示套餐·大份",
      "configId": "demo-config-large-v1",
      "components": [
        {
          "variantId": "demo-burger-large",
          "name": "演示汉堡",
          "variantLabel": "大份",
          "quantity": 1,
          "isGift": false,
          "unitPriceCents": 3200
        },
        {
          "variantId": "demo-fries-mid",
          "name": "演示薯条",
          "variantLabel": "中份",
          "quantity": 1,
          "isGift": false,
          "unitPriceCents": 1200
        },
        {
          "variantId": "demo-drink-mid",
          "name": "演示饮料",
          "variantLabel": "中杯",
          "quantity": 1,
          "isGift": false,
          "unitPriceCents": 1000
        }
      ]
    },
    "pickup|demo-combo-nuggets": {
      "name": "演示套餐·鸡块",
      "configId": "demo-config-nuggets-v1",
      "components": [
        {
          "variantId": "demo-nuggets-5",
          "name": "演示鸡块",
          "variantLabel": "5块装",
          "quantity": 1,
          "isGift": false,
          "unitPriceCents": 1300
        },
        {
          "variantId": "demo-fries-mid",
          "name": "演示薯条",
          "variantLabel": "中份",
          "quantity": 1,
          "isGift": false,
          "unitPriceCents": 1200
        },
        {
          "variantId": "demo-drink-mid",
          "name": "演示饮料",
          "variantLabel": "中杯",
          "quantity": 1,
          "isGift": false,
          "unitPriceCents": 1000
        }
      ]
    },
    "pickup|demo-combo-sweet": {
      "name": "演示套餐·甜品",
      "configId": "demo-config-sweet-v1",
      "components": [
        {
          "variantId": "demo-dessert-1",
          "name": "演示甜品",
          "variantLabel": "1份",
          "quantity": 1,
          "isGift": false,
          "unitPriceCents": null
        },
        {
          "variantId": "demo-drink-mid",
          "name": "演示饮料",
          "variantLabel": "中杯",
          "quantity": 1,
          "isGift": false,
          "unitPriceCents": 1000
        }
      ]
    },
    "pickup|demo-combo-limited": {
      "name": "演示套餐·限时",
      "configId": "demo-config-limited-v1",
      "components": [
        {
          "variantId": "demo-burger-mid",
          "name": "演示汉堡",
          "variantLabel": "中份",
          "quantity": 1,
          "isGift": false,
          "unitPriceCents": 2400
        },
        {
          "variantId": "demo-drink-mid",
          "name": "演示饮料",
          "variantLabel": "中杯",
          "quantity": 1,
          "isGift": false,
          "unitPriceCents": 1000
        }
      ]
    },
    "pickup|demo-combo-holiday": {
      "name": "演示套餐·节日限定",
      "configId": null,
      "components": []
    },
    "delivery|demo-combo-basic": {
      "name": "演示套餐·基础",
      "configId": "demo-config-basic-v1",
      "components": [
        {
          "variantId": "demo-burger-mid",
          "name": "演示汉堡",
          "variantLabel": "中份",
          "quantity": 1,
          "isGift": false,
          "unitPriceCents": 2600
        },
        {
          "variantId": "demo-fries-mid",
          "name": "演示薯条",
          "variantLabel": "中份",
          "quantity": 1,
          "isGift": false,
          "unitPriceCents": 1300
        },
        {
          "variantId": "demo-drink-mid",
          "name": "演示饮料",
          "variantLabel": "中杯",
          "quantity": 1,
          "isGift": false,
          "unitPriceCents": 1100
        }
      ]
    },
    "delivery|demo-combo-large": {
      "name": "演示套餐·大份",
      "configId": "demo-config-large-v1",
      "components": [
        {
          "variantId": "demo-burger-large",
          "name": "演示汉堡",
          "variantLabel": "大份",
          "quantity": 1,
          "isGift": false,
          "unitPriceCents": 3400
        },
        {
          "variantId": "demo-fries-mid",
          "name": "演示薯条",
          "variantLabel": "中份",
          "quantity": 1,
          "isGift": false,
          "unitPriceCents": 1300
        },
        {
          "variantId": "demo-drink-mid",
          "name": "演示饮料",
          "variantLabel": "中杯",
          "quantity": 1,
          "isGift": false,
          "unitPriceCents": 1100
        }
      ]
    },
    "delivery|demo-combo-nuggets": {
      "name": "演示套餐·鸡块",
      "configId": "demo-config-nuggets-v1",
      "components": [
        {
          "variantId": "demo-nuggets-5",
          "name": "演示鸡块",
          "variantLabel": "5块装",
          "quantity": 1,
          "isGift": false,
          "unitPriceCents": 1400
        },
        {
          "variantId": "demo-fries-mid",
          "name": "演示薯条",
          "variantLabel": "中份",
          "quantity": 1,
          "isGift": false,
          "unitPriceCents": 1300
        },
        {
          "variantId": "demo-drink-mid",
          "name": "演示饮料",
          "variantLabel": "中杯",
          "quantity": 1,
          "isGift": false,
          "unitPriceCents": 1100
        }
      ]
    },
    "delivery|demo-combo-sweet": {
      "name": "演示套餐·甜品",
      "configId": "demo-config-sweet-v1",
      "components": [
        {
          "variantId": "demo-dessert-1",
          "name": "演示甜品",
          "variantLabel": "1份",
          "quantity": 1,
          "isGift": false,
          "unitPriceCents": 1000
        },
        {
          "variantId": "demo-drink-mid",
          "name": "演示饮料",
          "variantLabel": "中杯",
          "quantity": 1,
          "isGift": false,
          "unitPriceCents": 1100
        }
      ]
    },
    "delivery|demo-combo-limited": {
      "name": "演示套餐·限时",
      "configId": "demo-config-limited-v1",
      "components": [
        {
          "variantId": "demo-burger-mid",
          "name": "演示汉堡",
          "variantLabel": "中份",
          "quantity": 1,
          "isGift": false,
          "unitPriceCents": 2600
        },
        {
          "variantId": "demo-drink-mid",
          "name": "演示饮料",
          "variantLabel": "中杯",
          "quantity": 1,
          "isGift": false,
          "unitPriceCents": 1100
        }
      ]
    },
    "delivery|demo-combo-holiday": {
      "name": "演示套餐·节日限定",
      "configId": null,
      "components": []
    }
  }
};
