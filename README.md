# 天天和警长的森林探案 (26 个字母启蒙版)

面向 4–6 岁儿童的森林双语 **26 个英文字母（A–Z）** 启蒙探索小游戏，适配横屏平板与离线 PWA。

- **双主角分工**：拉布拉多警长（`labrador`，纯中文探案引导，采用原版声音克隆 `X9smqJI1czUfUHFvbeQk`）与天天（`skye`，活泼双语与 26 个英文字母领读）；8 个森林章节覆盖 **26 个英文字母 A–Z**（第 1–7 关学习 `A-D` 至 `X-Z`，第 8 关为 `A–Z` 彩虹墙全收集狂欢，每字母 `8` 次语境聆听暴露）。
- **低门槛双场景与四大启蒙彩蛋**：
  - `Scene A`：森林字母寻宝（点触树洞、草丛、荷叶收集发光字母与彩蛋，即点即响）。
  - `Scene B`：声音工坊（听音辨识超大马卡龙字母积木，一点即中揭示萌物、洒礼花，并可点击「星光描红」巩固或继续下一题）。
  - **26 字母彩虹琴键 & 终章互动**：按《小星星 / ABC 字母歌》C 大调乐句排布 26 键，支持自由点弹、自动演奏与星光跟弹（同时嵌入第 8 关终章开场）。
  - **超宽松星光描红 & 大小写牵手**：高容错轨迹描红 26 个字母、A↔a 大小写配对彩蛋，解锁装扮间 5 款可爱头饰（含草莓蝴蝶结 `hat_bow` 与蝴蝶发箍 `hat_butterfly`）与贴纸树屋互动。
- **离线自包含**：单页 `forest.html`、Service Worker `sw.js`、子集化离线字体（`game/font_zh.woff2`、`game/font_en.woff2`）、Retina `2x` 高清贴图（`game/hd/`）与 `-18 LUFS` 离线配音包。

## 常用命令

```sh
# 完整质量门禁（eslint、tsc、8 关自动通关、13 项单元测试、26 字母暴露门禁、构建一致性校验）
env -u ELEVENLABS_API_KEY make check

# 重新打包独立页面 forest.html 与离线 sw.js
make build

# 校对清单并打发布包（< 60 MB）
python3 art/package_release.py
```

## 美术、字体与配音管线

- **切图与换装**：`python3 art/slice.py` 裁切绿幕图集；`python3 art/recolor.py` 生成服饰变体 `_d1`/`_d2`。
- **Retina 2x 与 PWA**：`python3 art/hd.py`（Real-ESRGAN `2x` 输出至 `game/hd/`）、`python3 art/make_icons.py`（PWA 图标）、`python3 art/make_fonts.py`（字体子集化）。
- **配音合成与无网校验**：`python3 art/narration.py` 需设置 `ELEVENLABS_API_KEY`；`python3 art/narration.py --verify-manifest` 可无网校验哈希清单。
