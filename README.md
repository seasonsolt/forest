# 天天和警长的森林探案 (Skye & Sheriff Labrador's Woodland Phonics)

儿童双语点触解谜 + 自然拼读（Phonics）合成小游戏，面向约 6 岁儿童，适配横屏平板与离线 PWA。

- **双主角分工**：拉布拉多警长（`labrador`）纯中文破案引导、天天（`skye`）双语自然拼读与英文词汇领读；8 个森林章节 × 24 个核心拼读/动作词（每词 `8` 次语境聆听暴露）。
- **双场景循环**：
  - `Scene A`：森林点触寻宝（搜寻线索道具、触发趣味交互与语音引导）。
  - `Scene B`：声音工坊（音素积木 `[ ? ] + [ rime ]` 拼读合成、单词卡点读与伙伴欢呼）。
- **离线自包含**：单一生成页 `forest.html`、Service Worker `sw.js`、子集化离线字体（`game/font_zh.woff2`、`game/font_en.woff2`）、Retina `2x` 高清贴图（`game/hd/`）与 `-18 LUFS` 离线配音包（`game/*.mp3` + `game/subs.json` + `game/vo_manifest.json`）。

## 常用命令

```sh
# 完整质量门禁（CI 同款：eslint、tsc、8 关自动通关、10 项单元测试、词频暴露门禁、构建一致性校验）
env -u ELEVENLABS_API_KEY make check

# 重新打包独立页面 forest.html 与离线 sw.js
make build

# 校对清单并打发布包（< 60 MB）
python3 art/package_release.py
```

## 美术、字体与配音管线

- **切图与换装**：`python3 art/slice.py` 裁切绿幕图集（含联通域与投影波谷切分）；`python3 art/recolor.py` 生成服饰变体 `_d1`/`_d2`。
- **Retina 2x 与 PWA**：`python3 art/hd.py`（Real-ESRGAN `2x` 输出至 `game/hd/`）、`python3 art/make_icons.py`（PWA 图标）、`python3 art/make_fonts.py`（字体子集化）。
- **配音合成与无网校验**：`python3 art/narration.py` 需设置 `ELEVENLABS_API_KEY` 生成配音；`python3 art/narration.py --verify-manifest` 可在无密钥/离线环境完成哈希清单校验。
