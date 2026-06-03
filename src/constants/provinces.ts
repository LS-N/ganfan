export type ProvinceMeta = {
  id: string
  x: number
  y: number
  w: number
  h: number
  emoji: string
  cuisine: string
}

export const PROVINCES: ProvinceMeta[] = [
  { id: "黑龙江", x: 310, y: 30, w: 90, h: 80, emoji: "🍲", cuisine: "东北菜" },
  { id: "吉林", x: 300, y: 105, w: 70, h: 45, emoji: "🍲", cuisine: "东北菜" },
  { id: "辽宁", x: 280, y: 145, w: 65, h: 40, emoji: "🍲", cuisine: "东北菜" },
  { id: "内蒙古", x: 160, y: 50, w: 180, h: 70, emoji: "🥩", cuisine: "蒙古菜" },
  { id: "新疆", x: 20, y: 60, w: 140, h: 110, emoji: "🍖", cuisine: "新疆菜" },
  { id: "西藏", x: 50, y: 175, w: 120, h: 80, emoji: "🥘", cuisine: "藏菜" },
  { id: "青海", x: 140, y: 165, w: 80, h: 65, emoji: "🍜", cuisine: "青海菜" },
  { id: "甘肃", x: 170, y: 120, w: 90, h: 70, emoji: "🍜", cuisine: "西北菜" },
  { id: "宁夏", x: 210, y: 130, w: 30, h: 35, emoji: "🥙", cuisine: "清真菜" },
  { id: "陕西", x: 220, y: 155, w: 40, h: 65, emoji: "🥙", cuisine: "陕菜" },
  { id: "山西", x: 245, y: 130, w: 40, h: 55, emoji: "🍝", cuisine: "晋菜" },
  { id: "河北", x: 262, y: 110, w: 50, h: 40, emoji: "🥘", cuisine: "冀菜" },
  { id: "北京", x: 278, y: 108, w: 18, h: 16, emoji: "🦆", cuisine: "京菜" },
  { id: "天津", x: 285, y: 120, w: 14, h: 12, emoji: "🥟", cuisine: "津菜" },
  { id: "山东", x: 268, y: 148, w: 60, h: 40, emoji: "🥜", cuisine: "鲁菜" },
  { id: "河南", x: 245, y: 175, w: 55, h: 40, emoji: "🫓", cuisine: "豫菜" },
  { id: "四川", x: 185, y: 190, w: 70, h: 60, emoji: "🌶️", cuisine: "川菜" },
  { id: "重庆", x: 228, y: 205, w: 22, h: 22, emoji: "🔥", cuisine: "渝菜" },
  { id: "云南", x: 175, y: 245, w: 65, h: 60, emoji: "🌿", cuisine: "滇菜" },
  { id: "贵州", x: 220, y: 235, w: 45, h: 40, emoji: "🥘", cuisine: "黔菜" },
  { id: "湖南", x: 248, y: 215, w: 50, h: 45, emoji: "🌶️", cuisine: "湘菜" },
  { id: "湖北", x: 248, y: 183, w: 55, h: 35, emoji: "🐟", cuisine: "鄂菜" },
  { id: "安徽", x: 278, y: 183, w: 42, h: 45, emoji: "🍲", cuisine: "徽菜" },
  { id: "江苏", x: 288, y: 163, w: 45, h: 30, emoji: "🦀", cuisine: "苏菜" },
  { id: "上海", x: 310, y: 185, w: 14, h: 12, emoji: "🥟", cuisine: "沪菜" },
  { id: "浙江", x: 295, y: 200, w: 42, h: 35, emoji: "🦐", cuisine: "浙菜" },
  { id: "江西", x: 268, y: 215, w: 42, h: 42, emoji: "🍵", cuisine: "赣菜" },
  { id: "福建", x: 288, y: 238, w: 42, h: 35, emoji: "🦪", cuisine: "闽菜" },
  { id: "广东", x: 255, y: 265, w: 65, h: 45, emoji: "🍵", cuisine: "粤菜" },
  { id: "广西", x: 210, y: 265, w: 55, h: 48, emoji: "🍜", cuisine: "桂菜" },
  { id: "海南", x: 248, y: 308, w: 28, h: 22, emoji: "🥥", cuisine: "琼菜" },
  { id: "台湾", x: 318, y: 248, w: 20, h: 30, emoji: "🧋", cuisine: "台湾菜" }
]

export const MAP_PROVINCE_TOTAL = PROVINCES.length

const DISH_CUISINE_MAP: Record<string, { cuisine: string; province: string }> = {
  黄焖鸡米饭: { cuisine: "鲁菜", province: "山东" },
  麻辣香锅: { cuisine: "川菜", province: "四川" },
  麻婆豆腐: { cuisine: "川菜", province: "四川" },
  回锅肉: { cuisine: "川菜", province: "四川" },
  水煮鱼: { cuisine: "川菜", province: "四川" },
  鱼香肉丝: { cuisine: "川菜", province: "四川" },
  宫保鸡丁: { cuisine: "川菜", province: "四川" },
  红烧肉: { cuisine: "川菜", province: "四川" },
  东坡肉: { cuisine: "浙菜", province: "浙江" },
  白切鸡饭: { cuisine: "粤菜", province: "广东" },
  白切鸡: { cuisine: "粤菜", province: "广东" },
  叉烧饭: { cuisine: "粤菜", province: "广东" },
  烧鸭饭: { cuisine: "粤菜", province: "广东" },
  虾饺: { cuisine: "粤菜", province: "广东" },
  肠粉: { cuisine: "粤菜", province: "广东" },
  煲仔饭: { cuisine: "粤菜", province: "广东" },
  小笼包: { cuisine: "沪菜", province: "上海" },
  生煎包: { cuisine: "沪菜", province: "上海" },
  蟹粉小笼: { cuisine: "苏菜", province: "江苏" },
  西湖醋鱼: { cuisine: "浙菜", province: "浙江" },
  龙井虾仁: { cuisine: "浙菜", province: "浙江" },
  臭鳜鱼: { cuisine: "徽菜", province: "安徽" },
  佛跳墙: { cuisine: "闽菜", province: "福建" },
  沙茶面: { cuisine: "闽菜", province: "福建" },
  剁椒鱼头: { cuisine: "湘菜", province: "湖南" },
  毛氏红烧肉: { cuisine: "湘菜", province: "湖南" },
  辣椒炒肉: { cuisine: "湘菜", province: "湖南" },
  糖醋里脊: { cuisine: "鲁菜", province: "山东" },
  锅包肉: { cuisine: "东北菜", province: "辽宁" },
  地三鲜: { cuisine: "东北菜", province: "辽宁" },
  肉夹馍: { cuisine: "陕菜", province: "陕西" },
  羊肉泡馍: { cuisine: "陕菜", province: "陕西" },
  兰州拉面: { cuisine: "西北菜", province: "甘肃" },
  大盘鸡: { cuisine: "新疆菜", province: "新疆" },
  北京烤鸭: { cuisine: "京菜", province: "北京" },
  炸酱面: { cuisine: "京菜", province: "北京" },
  煎饼果子: { cuisine: "津菜", province: "天津" },
  番茄鸡蛋面: { cuisine: "家常菜", province: "全国" },
  鸡胸肉沙拉: { cuisine: "轻食", province: "全国" },
  日式定食: { cuisine: "日料", province: "境外" },
  寿司: { cuisine: "日料", province: "境外" },
  韩式拌饭: { cuisine: "韩餐", province: "境外" },
  汉堡: { cuisine: "西餐", province: "境外" },
  披萨: { cuisine: "西餐", province: "境外" }
}

export function getProvinceMeta(id?: string) {
  return PROVINCES.find((province) => province.id === id)
}

export function inferCuisineFromDish(dish?: string) {
  const normalized = dish?.trim()
  if (!normalized) return { cuisine: "家常菜", province: "全国" }
  const exact = DISH_CUISINE_MAP[normalized]
  if (exact) return exact
  const partial = Object.entries(DISH_CUISINE_MAP).find(([name]) => normalized.includes(name) || name.includes(normalized))
  return partial?.[1] ?? { cuisine: "家常菜", province: "全国" }
}
