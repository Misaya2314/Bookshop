export const formatTime = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return (
    [year, month, day].map(formatNumber).join('/') +
    ' ' +
    [hour, minute, second].map(formatNumber).join(':')
  )
}

// 格式化相对时间显示（今天、昨天等）
export const formatRelativeTime = (time: string | Date): string => {
  try {
    let date: Date
    
    if (time instanceof Date) {
      date = time
    } else {
      // 标准化时间字符串格式
      const normalizedTime = normalizeTimeString(time)
      date = new Date(normalizedTime)
    }
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      console.error('无效的时间格式:', time)
      return '无效时间'
    }
    
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    // 如果时间差异过大（比如超过1年），直接显示完整日期
    if (Math.abs(diff) > 365 * 24 * 60 * 60 * 1000) {
      console.warn('时间异常，显示完整日期:', {
        inputTime: time,
        parsedDate: date.toString(),
        currentTime: now.toString(),
        diff: diff
      })
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
    }
    
    if (diff < 24 * 60 * 60 * 1000 && diff > -24 * 60 * 60 * 1000) {
      return '今天'
    } else if (diff < 2 * 24 * 60 * 60 * 1000 && diff > 0) {
      return '昨天'
    } else if (diff > -2 * 24 * 60 * 60 * 1000 && diff < 0) {
      return '明天'
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`
    }
  } catch (error) {
    console.error('时间格式化错误:', error, time)
    return '时间错误'
  }
}

// 标准化日期字符串格式，兼容iOS
const normalizeTimeString = (time: string): string => {
  if (typeof time !== 'string') {
    return time
  }
  
  // 将 "YYYY-MM-DD HH:mm" 格式转换为 ISO 格式 "YYYY-MM-DDTHH:mm:ss"
  // 这样可以确保在所有平台上都能正确解析
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(time)) {
    return time.replace(' ', 'T') + ':00'
  }
  
  // 将 "YYYY-MM-DD HH:mm:ss" 格式转换为 ISO 格式
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(time)) {
    return time.replace(' ', 'T')
  }
  
  return time
}

// 格式化完整时间显示
export const formatFullTime = (time: string | Date): string => {
  try {
    let date: Date
    
    if (time instanceof Date) {
      date = time
    } else {
      // 标准化时间字符串格式
      const normalizedTime = normalizeTimeString(time)
      date = new Date(normalizedTime)
    }
    
    if (isNaN(date.getTime())) {
      console.error('无效的时间格式:', time)
      return '无效时间'
    }
    
    const year = date.getFullYear()
    const month = formatNumber(date.getMonth() + 1)
    const day = formatNumber(date.getDate())
    const hour = formatNumber(date.getHours())
    const minute = formatNumber(date.getMinutes())
    
    return `${year}年${month}月${day}日 ${hour}:${minute}`
  } catch (error) {
    console.error('完整时间格式化错误:', error, time)
    return '时间错误'
  }
}

const formatNumber = (n: number) => {
  const s = n.toString()
  return s[1] ? s : '0' + s
}
