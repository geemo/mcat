## mcat

> mongodb log cat

### 背景

目前查询 `Mongodb` 的日志比较困难。
如果 `Mongodb` 出现问题，可以通过 `Grafana` 查看到出现问题的节点，但是该节点出现了什么问题还需要在具体的机器上查看该节点的 `Mongodb` 日志。
不少同学没有 `Mongodb` 机器的权限无法上机器查看日志。

### 功能
- 按机器查看日志
- 按时间范围查看日志（如最近 `30min`、最近 `1h` 等）
- 基于上述范围 `grep` 具体的字符串

由于 `mcat` 扫描日志是通过一个固定的 `bufSize` 迭代从日志最后往前扫，因此完全不用担心由于**文件太大**导致扫描过程爆内存的情况。

### 快速开始

请求url
```
http://localhost:2233
```

请求body
```js
{
  "hostname":"geemo.cat",       // 机器名
  "fname":"/data/geemo.log",    // 日志文件路径
  "matchStr":"geemo",           // 匹配字符
  "timeRange":"1m",             // 搜索时间范围, m 代表分钟, h 代表小时
  "bufSize":4                   // 搜索块的大小, 单位 (KB), 同时也是返回内容块的大小
}
```
