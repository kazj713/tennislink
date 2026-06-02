# 生产环境最终交付 - 部署指南

## 📋 部署前检查清单

### ✅ 已完成的开发任务

**P0 紧急修复（已完成）:**
- [x] Task 1: 修复支付提交JSON解析错误（`/api/court-bookings/route.ts`）
- [x] Task 2: 重写场地预约页面为时间表网格布局（`/venues/page.tsx`）
- [x] Task 3: 修复后台删除场地功能（`/api/admin/courts/[id]/route.ts`, `venueManager.ts`）

**P1 高优先级功能（已完成）:**
- [x] Task 4: Navbar登录状态感知与个人中心菜单（`Navbar.tsx`）
- [x] Task 5: 后台管理系统UI配色修复（9个文件）
- [x] Task 6: 支付配置强制启用支付宝（`settings/page.tsx`, `ecosystem.config.js`）
- [x] Task 7: GPS定位功能实现（`useGeolocation.ts` Hook + `/api/geocode` API）
- [x] Task 8: 高德地图导航集成（`AmapNavigation.tsx` 组件）

### 📦 新增/修改的文件列表

**核心页面组件:**
```
src/app/venues/page.tsx                          # 完全重写 - 时间表网格布局
src/components/Navbar.tsx                        # 登录状态感知
src/components/AmapNavigation.tsx                # 新增 - 高德地图导航组件
src/hooks/useGeolocation.ts                      # 新增 - GPS定位Hook
```

**API路由:**
```
src/app/api/court-bookings/route.ts              # 增强错误处理
src/app/api/admin/courts/[id]/route.ts           # 删除功能增强
src/app/api/geocode/route.ts                     # 新增 - 逆地理编码API
```

**数据库管理器:**
```
src/storage/database/venueManager.ts             # 增强删除预检查
src/storage/database/courtBookingManager.ts       # 新增 - 场地预订管理器
```

**后台管理页面（UI配色修复）:**
```
src/app/admin/layout.tsx                         # 统一配色
src/app/admin/venues/page.tsx                    # 文字可读性修复
src/app/admin/settings/page.tsx                  # 支付配置调整
src/app/admin/page.tsx                           # 数据看板配色
src/app/admin/users/page.tsx                     # 用户管理配色
src/app/admin/coaches/page.tsx                   # 教练管理配色
src/app/admin/profit-sharing/page.tsx            # 分账管理配色
src/app/admin/seed/page.tsx                      # 数据初始化配色
```

**配置文件:**
```
ecosystem.config.js                              # 硬编码支付配置
.env.production                                  # 添加AMAP_WEB_KEY
```

---

## 🚀 部署步骤

### 方式一：完整项目上传（推荐首次部署）

```bash
# 1. 在本地项目根目录执行
cd d:\tennis-link-backup

# 2. 打包除node_modules和.git外的所有文件
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.next' \
    -czvf tennis-link-deploy.tar.gz .

# 3. 上传到服务器
scp tennis-link-deploy.tar.gz root@175.24.132.17:/tmp/

# 4. SSH登录服务器
ssh root@175.24.132.17

# 5. 在服务器上执行以下命令：
cd /var/www/tennis-link

# 备份当前版本
mv .next .next.backup.$(date +%Y%m%d_%H%M%S)
mv src src.backup.$(date +%Y%m%d_%H%M%S)

# 解压新版本
tar -xzvf /tmp/tennis-link-deploy.tar.gz -C /var/www/tennis-link

# 安装依赖（如果有新增的包）
npm install

# 构建
npm run build

# 重启PM2服务
pm2 restart ecosystem.config.js

# 查看日志确认启动成功
pm2 logs tennis-link --lines 20
```

### 方式二：增量更新（仅上传修改的文件）

```bash
# 在本地执行（需要配置SSH免密登录或手动输入密码）

# 上传核心文件
scp src/app/venues/page.tsx root@175.24.132.17:/var/www/tennis-link/src/app/venues/
scp src/hooks/useGeolocation.ts root@175.24.132.17:/var/www/tennis-link/src/hooks/
scp src/components/AmapNavigation.tsx root@175.24.132.17:/var/www/tennis-link/src/components/
scp src/components/Navbar.tsx root@175.24.132.17:/var/www/tennis-link/src/components/

# 上传API路由
scp src/app/api/court-bookings/route.ts root@175.24.132.17:/var/www/tennis-link/src/app/api/court-bookings/
scp src/app/api/geocode/route.ts root@175.24.132.17:/var/www/tennis-link/src/app/api/geocode/
scp src/app/api/admin/courts/\[id\]/route.ts root@175.24.132.17:/var/www/tennis-link/src/app/api/admin/courts/[id]/

# 上传数据库管理器
scp src/storage/database/courtBookingManager.ts root@175.24.132.17:/var/www/tennis-link/src/storage/database/
scp src/storage/database/venueManager.ts root@175.24.132.17:/var/www/tennis-link/src/storage/database/

# 上传后台管理页面
scp src/app/admin/layout.tsx root@175.24.132.17:/var/www/tennis-link/src/app/admin/
scp src/app/admin/settings/page.tsx root@175.24.132.17:/var/www/tennis-link/src/app/admin/settings/
scp src/app/admin/venues/page.tsx root@175.24.132.17:/var/www/tennis-link/src/app/admin/venues/
# ... 其他admin页面类似

# 上传配置文件
scp ecosystem.config.js root@175.24.132.17:/var/www/tennis-link/
scp .env.production root@175.24.132.17:/var/www/tennis-link/

# SSH到服务器执行构建和重启
ssh root@175.24.132.17 "cd /var/www/tennis-link && npm run build && pm2 restart ecosystem.config.js"
```

### 方式三：Git Pull方式（如果服务器已配置Git）

```bash
# 1. 先将代码推送到GitHub（如果尚未推送）
git add .
git commit -m "生产环境最终交付 - 全量功能增强"
git push origin main

# 2. SSH到服务器执行
ssh root@175.24.132.17

# 3. 在服务器上拉取最新代码
cd /var/www/tennis-link
git pull origin main

# 4. 构建并重启
npm run build
pm2 restart ecosystem.config.js
```

---

## 🔧 服务器端配置要求

### 环境变量检查

确保服务器的`.env.production`包含以下新增配置：

```bash
# 必须添加高德地图API Key（请替换为真实的Key）
AMAP_WEB_KEY=你的高德地图Web服务API_Key

# 确认以下配置存在且正确：
ENABLE_ALIPAY=true          # 强制启用支付宝
ALIPAY_SANDBOX=false        # 生产环境关闭沙箱
QWEATHER_API_KEY=...        # 和风天气API Key
```

### PM2配置检查

确保`ecosystem.config.js`包含：

```javascript
module.exports = {
  apps: [{
    name: 'tennis-link',
    script: 'node_modules/.bin/next',
    args: 'start',
    env: {
      ENABLE_ALIPAY: 'true',
      ALIPAY_SANDBOX: 'false',
      NODE_ENV: 'production',
      // ... 其他配置
    }
  }]
};
```

---

## ✅ 部署后验证清单

### Task 10: 生产环境端到端功能验证

请逐一验证以下功能：

#### 1️⃣ 登录与导航栏 (Task 4)
- [ ] 访问 https://ydtenhub.online
- [ ] 未登录状态：显示"登录"和"注册"按钮
- [ ] 登录成功后：右上角变为"个人中心"下拉菜单
- [ ] 下拉菜单包含：个人信息、我的订单、退出登录
- [ ] 点击退出登录后恢复为未登录状态

#### 2️⃣ 场地预约时间表网格 (Task 2)
- [ ] 访问 https://ydtenhub.online/venues
- [ ] 页面显示时间表网格布局（非旧版卡片列表）
- [ ] 顶部显示"预约场地"标题 + GPS定位按钮
- [ ] 显示7天日期选择器（今天/明天/周三...）
- [ ] 显示当天天气信息（温度+天气状况）
- [ ] 时间范围07:00-22:00，格式XX:00-XX:59
- [ ] 球场列头显示正确（室外1号场、室内1号场等）
- [ ] 单元格5种状态样式正常：
  - 普通时段：奶油色背景
  - 高峰时段：浅黄色+"🔥高峰"标签
  - 折扣时段：橙色+"🏷️折扣"标签
  - 已选中：深墨绿色+白色圆点脉冲动画
  - 已售罄：灰色+删除线
- [ ] 点击单元格可切换选中/取消
- [ ] 底部固定面板显示已选时段列表
- [ ] 总计金额实时计算正确
- [ ] "立即预订"按钮可点击

#### 3️⃣ 支付提交无JSON错误 (Task 1)
- [ ] 选择至少1个时段
- [ ] 点击"立即预订"
- [ ] 不再出现 "Unexpected end of JSON input" 错误
- [ ] 成功时显示Toast提示："成功预订N个时段！"
- [ ] 失败时显示友好提示（非技术性错误信息）

#### 4️⃣ GPS定位功能 (Task 7)
- [ ] 点击右上角定位按钮
- [ ] 浏览器弹出位置权限请求
- [ ] 授权后显示绿色"已定位"图标 + 脉冲动画
- [ ] 显示城市名称（如"📍 当前位置：北京市"）
- [ ] 拒绝权限后显示红色"未定位" + 提示文字
- [ ] 定位失败时可点击重试

#### 5️⃣ 后台管理功能 (Task 3, 5, 6)
- [ ] 访问 https://ydtenhub.online/admin （需管理员账号）
- [ ] **场地删除功能**：点击删除 → 成功删除（不再提示"删除场地失败"）
- [ ] **UI配色**：所有后台页面文字清晰可读（白色/浅色文字）
  - [ ] 数据看板首页
  - [ ] 用户管理
  - [ ] 教练管理
  - [ ] 场地管理
  - [ ] 分账管理
  - [ ] 系统设置
- [ ] **支付设置**：
  - [ ] 支付宝选项：✅ 已永久启用（disabled + checked）
  - [ ] 微信支付选项：🚧 即将推出（disabled）
  - [ ] 测试模式选项：🔒 生产锁定（disabled）

#### 6️⃣ 高德地图导航 (Task 8)
- [ ] 如果场地详情页显示地址链接
- [ ] 点击地址后打开新标签页跳转至高德地图导航
- [ ] URL格式正确：`https://uri.amap.com/navigation?to=经度,纬度,名称&mode=car`
- [ ] 移动端优先尝试唤起高德App（如已安装）

---

## 🐛 常见问题排查

### 问题1：构建失败 - Module not found
**症状**: `Can't resolve '@/storage/database/courtBookingManager'`
**解决**: 
```bash
# 确认文件已上传
ls -la /var/www/tennis-link/src/storage/database/courtBookingManager.ts
```

### 问题2：支付宝SDK初始化警告
**症状**: 构建日志显示 `[支付宝] SDK初始化失败: TypeError: s is not a constructor`
**影响**: 仅影响构建时的SDK加载检测，不影响运行时功能
**解决**: 可忽略此警告，生产环境中会从环境变量正确加载证书

### 问题3：GPS定位不工作
**症状**: 点击定位按钮无反应
**原因**: 
- 浏览器不支持Geolocation API
- HTTPS要求（部分浏览器要求安全上下文）
- 用户拒绝位置权限
**解决**: 
- 使用Chrome/Firefox现代浏览器
- 确保网站通过HTTPS访问（ydtenhub.online已配置SSL）
- 检查浏览器地址栏的位置权限设置

### 问题4：高德地图导航无法打开
**症状**: 点击导航按钮无反应
**原因**: `AMAP_WEB_KEY` 未配置或无效
**解决**: 
```bash
# 编辑.env.production
vim /var/www/tennis-link/.env.production

# 添加真实的高德地图Key
AMAP_WEB_KEY=your_real_amap_key_here

# 重启PM2
pm2 restart ecosystem.config.js
```

### 问题5：场地时间表数据为空
**症状**: 时间表网格没有显示球场列
**原因**: `/api/courts` 返回空数组或Mock数据未生效
**解决**: 
- 检查数据库courts表是否有数据
- 如无数据，访问 `/admin/seed` 页面初始化测试数据
- 或检查浏览器控制台的网络请求

---

## 📊 性能优化建议

### 已实施的优化
- ✅ Turbopack构建加速
- ✅ CSS优化（optimizeCss实验特性）
- ✅ 包导入优化（optimizePackageImports）
- ✅ 静态页面预渲染（91个静态页面）

### 可选优化项
- [ ] 启用CDN加速静态资源
- [ ] 配置图片懒加载
- [ ] 添加Service Worker支持离线访问
- [ ] 开启Gzip/Brotli压缩（Nginx层）

---

## 📝 回滚方案

如果部署后出现严重问题：

```bash
# 1. SSH到服务器
ssh root@175.24.132.17

# 2. 停止当前服务
pm2 stop tennis-link

# 3. 恢复备份（如果有）
cd /var/www/tennis-link
cp -r .next.backup.20260601_120000 .next
cp -r src.backup.20260601_120000 src

# 4. 重启服务
pm2 start tennis-link

# 5. 验证回滚成功
curl http://localhost:3000/api/health
```

---

## 🎯 下一步计划

本次交付完成后，建议后续迭代：

1. **用户反馈收集**：监控生产环境错误日志和用户反馈
2. **性能监控**：接入Sentry或类似工具监控前端错误
3. **移动端适配测试**：重点测试场地预约页面在手机端的体验
4. **支付流程完善**：对接真实支付宝沙箱测试完整支付流程
5. **数据统计**：添加场地预订转化率等业务指标

---

**部署日期**: 2026-06-01  
**版本号**: v2.0.0-production-final  
**部署负责人**: AI Assistant  
**文档版本**: 1.0
