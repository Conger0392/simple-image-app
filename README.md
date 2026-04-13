# simple-image-app

一个面向 `XXXXX` 的本地图片工作台，提供令牌管理、图片生成、参考图编辑、多图融合、试衣、换脸、风格转换，以及 OpenAI / Anthropic 兼容接口。

## 项目特性

- Web 工作台：在一个页面内管理 token、选择模型、上传参考图并生成图片
- Token 管理：支持单条新增 / 编辑 / 删除、CSV 导入、余额刷新、使用状态筛选
- 图片工作流：支持标准生成、参考图编辑、多图融合、试衣、换脸、风格转换
- 历史记录：保存每次生成记录，支持分页、详情查看与删除
- 兼容接口：提供 `/v1/*` 风格的聊天与图片生成接口，便于接入兼容 OpenAI / Anthropic 的客户端
- 零额外依赖：当前 `package.json` 仅使用 Node.js 内置能力启动与测试

## 目录结构

```text
.
├─ public/                 前端静态资源
│  ├─ index.html           页面结构
│  ├─ index.css            页面样式
│  ├─ index.js             前端交互逻辑
│  └─ pagination-utils.js  分页辅助工具
├─ server-routes/
│  ├─ internal-api.js      工作台内部接口 `/api/*`
│  └─ compat-api.js        兼容接口 `/v1/*`
├─ data/
│  ├─ jwt_tokens.csv       token 数据
│  ├─ history.json         生成历史
│  ├─ saved/               保存到本地的图片
│  └─ uploads/             上传参考图缓存
├─ docs/plans/             设计与实现文档
├─ server.js               Node.js 服务入口
└─ tests/
   ├─ api-pagination.test.js      服务端分页测试
   ├─ frontend-regression.test.js 前端回归测试
   ├─ logging.test.js             日志回归测试
   └─ test-runner-location.test.js 测试目录回归测试
```

## 运行环境

- 建议 Node.js `20+`
- 操作系统不限，当前仓库主要在 Windows 环境下开发

说明：项目代码直接使用了 Node.js 内置的 `fetch`、`FormData`、`File` 等 Web API，因此建议使用较新的 Node 版本运行。

## 快速开始

### 1. 安装 / 准备

当前项目没有额外 npm 依赖，通常无需执行安装。

### 2. 启动服务

```bash
npm start
```

默认监听：

```text
http://127.0.0.1:13000
```

也可以通过环境变量指定端口：

```bash
PORT=13001 npm start
```

Windows PowerShell 示例：

```powershell
$env:PORT=13001
npm start
```

### 3. 打开页面

浏览器访问：

```text
http://127.0.0.1:13000
```

## 数据文件

服务启动时会自动确保以下文件 / 目录存在：

- `data/jwt_tokens.csv`
- `data/history.json`
- `data/saved/`
- `data/uploads/`

### token CSV 字段

默认表头：

```csv
id,email,password,jwtToken,balance,createdAt,isAgreeShareImages
```

前端导入 CSV 时支持以下列：

```csv
email,password,jwtToken,balance,createdAt
```

## 工作台功能

### 令牌管理

- 新增、编辑、删除 token
- 根据历史记录识别“已使用 / 未使用”
- 按“余额不足 15”筛选低余额 token
- 调用远端接口刷新单个 token 余额
- 通过 CSV 批量导入 token

### 图片生成

当前页面支持以下操作模式：

- `generate`：标准生成
- `tryon`：试衣
- `faceswap`：换脸
- `style`：风格转换

并支持：

- 模型分组展示
- 单张或多张参考图上传
- 顺序上传弹窗（试衣 / 换脸）
- 风格提示词预设与风格示意图
- 结果图片展示与历史记录留存

## 主要接口

### 内部接口 `/api/*`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/models` | 获取模型分组与默认模型 |
| GET | `/api/tokens` | 分页获取 token 列表，支持筛选 |
| POST | `/api/tokens` | 新增 token |
| PUT | `/api/tokens/:id` | 更新 token |
| DELETE | `/api/tokens/:id` | 删除 token |
| POST | `/api/tokens/import` | 导入 CSV token |
| GET | `/api/tokens/:id/balance` | 刷新并回写余额 |
| GET | `/api/history` | 分页获取生成历史 |
| DELETE | `/api/history/:id` | 删除历史记录 |
| POST | `/api/generate` | 执行图片生成 / 编辑 / 融合 |
| GET | `/api/save-image` | 下载远程图片到本地 `data/saved/` |

分页参数约定：

- `page`：页码，默认 `1`
- `pageSize`：每页条数，默认 `20`，最大 `50`
- `filter`：`all` / `used` / `unused` / `low-balance`

### 兼容接口 `/v1/*`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/v1/models` | 返回兼容模型列表 |
| POST | `/v1/chat/completions` | OpenAI 风格聊天接口，支持 `stream` |
| POST | `/v1/images/generations` | OpenAI 风格图片接口 |
| POST | `/v1/messages` | Anthropic 风格消息接口，支持 `stream` |

兼容接口会：

- 校验 API Key
- 自动挑选余额足够的 token
- 调用上游服务后扣减本地余额

## 测试

运行全部测试：

```bash
npm test
```

当前测试覆盖重点：

- `/api/tokens` 分页与筛选
- `/api/history` 分页排序
- 兼容 API 日志与上游日志回归检查
- 前端分页工具与测试目录关键回归检查

## 开发说明

- 服务入口为 `server.js`
- 静态页面由 `server.js` 直接托管 `public/` 目录
- 服务端路由拆分在 `server-routes/internal-api.js` 与 `server-routes/compat-api.js`
- 历史记录存储在 `data/history.json`
- token 数据存储在 `data/jwt_tokens.csv`
# 社区链接
[LinuxDO](https://linux.do/)
