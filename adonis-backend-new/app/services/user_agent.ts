export class UserAgent {
  private ua: string
  private regexes: Record<string, RegExp[]>

  constructor(ua: string) {
    this.ua = ua
    this.regexes = {
      browser: [/Edge\/(\d+)/, /Chrome\/(\d+)/, /Firefox\/(\d+)/, /Safari\/(\d+)/],
      os: [/Windows NT (\d+\.\d+)/, /Mac OS X (\d+[._]\d+[._]?\d*)/, /Linux/, /iPhone OS (\d+[._]\d+)/, /Android (\d+\.?\d*)/],
      device: [/Mobi|iPhone|Android/, /Tablet|iPad/],
    }
  }

  getBrowser(): string | null {
    const browsers = ['Edge', 'Chrome', 'Firefox', 'Safari']
    for (let i = 0; i < this.regexes.browser.length; i++) {
      const match = this.ua.match(this.regexes.browser[i])
      if (match) return browsers[i]
    }
    return null
  }

  getOS(): string | null {
    const oses = ['Windows', 'Mac OS', 'Linux', 'iOS', 'Android']
    for (let i = 0; i < this.regexes.os.length; i++) {
      const match = this.ua.match(this.regexes.os[i])
      if (match) return oses[i]
    }
    return null
  }

  getDevice(): string | null {
    if (this.regexes.device[0].test(this.ua)) return 'Mobile'
    if (this.regexes.device[1].test(this.ua)) return 'Tablet'
    return 'Desktop'
  }
}
