import { v4 as uuidv4 } from 'uuid'

export class GuestTokenService {
  async generateToken(): Promise<string> {
    return uuidv4()
  }
}
