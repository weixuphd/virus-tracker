# Virus-tracker AI-READY Dataset Card

- **Schema**: virus-tracker.ai-ready.v1
- **Generated**: 2026-10-26T08:13:47.232309Z
- **Events**: 848（train 678 / benchmark 170，
  按 event_id 隔离）
- **Instruction samples**: 200000
- **Benchmark samples**: 40000
- **Pretraining corpus**: 10,047,503,102 tokens
  （target 10,000,000,000；base 110,412,122 tokens，
  augmentation ×91，streaming）
- **Tokenizer**: cl100k_base
- **Fine-tune eval**: accuracy 0.9882，
  macro recall 0.9836
- **Uplift vs majority**: accuracy 37.59 pp，
  recall 73.36 pp

## Files

| 文件 | 说明 |
|---|---|
| `instruction/train.jsonl` | ≥5 万条指令微调样本 |
| `benchmark/benchmark.jsonl` | ≥1 万条基准测试样本 |
| `pretrain/pretrain_manifest.json` | 预训练 token 预算与生成方法 |
| `pretrain/pretrain_base.jsonl` | 基础实料（源文章/事件/指令/基准） |
| `pretrain/pretrain_sample.jsonl` | 预训练语料样本 |
| `eval/metrics.json` | 微调模型与基线评测 |
| `manifest.json` | 数据集清单 |
| `compliance.json` / `compliance.md` | 19 项指标合规报告 |

## 方法

指令与基准样本由真实事件、规则/LLM 标注和多模板改写生成；训练/测试按 `event_id` 隔离，避免事件泄漏。
预训练语料采用确定性多模板、实体排列、语言切换与问答增强的 streaming 生成方式，manifest 记录 token 预算、平均 token 数与可复现参数；默认不全量落盘，可用同一生成器物化。

## 限制

合成样本用于工程验证与训练/评测流程，不替代真实临床标注；病例数、死亡数与地区仍需回溯原始来源。
微调评测的达标口径为“vs 零样本多数类基线”；规则基线是标签生成器之一，仅作透明性对照，不作为基础模型。
