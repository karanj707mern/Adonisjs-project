import geoip from 'geoip-lite'
import { UserAgent } from './user_agent'

export class DeviceInfoService {
  getUserAgentInfo(userAgentString: string) {
    const ua = new UserAgent(userAgentString)
    return {
      browser: ua.getBrowser(),
      os: ua.getOS(),
      device: ua.getDevice(),
    }
  }

  getIpInfo(ip: string) {
    const geo = geoip.lookup(ip)
    if (!geo) {
      return {
        country: null,
        city: null,
        timezone: null,
      }
    }

    return {
      country: geo.country,
      city: geo.city,
      timezone: geo.timezone,
    }
  }

  getDeviceInfo(ip: string, userAgentString: string) {
    const ipInfo = this.getIpInfo(ip)
    const uaInfo = this.getUserAgentInfo(userAgentString)

    return {
      ...ipInfo,
      ...uaInfo,
    }
  }
}
