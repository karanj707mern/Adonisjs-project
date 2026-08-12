import { schema, rules } from '@adonisjs/validator'

export const registerSchema = schema.create({
  name: schema.string({}, [rules.maxLength(255)]),
  email: schema.string({}, [rules.email(), rules.maxLength(255)]),
  password: schema.string({}, [rules.minLength(6), rules.maxLength(255)]),
})

export const loginSchema = schema.create({
  email: schema.string({}, [rules.email(), rules.maxLength(255)]),
  password: schema.string({}, [rules.minLength(6), rules.maxLength(255)]),
})

export const createOrderSchema = schema.create({
  recipientName: schema.string({}, [rules.maxLength(255)]),
  phoneNumber: schema.string({}, [rules.maxLength(20)]),
  addressLine1: schema.string({}, [rules.maxLength(255)]),
  addressLine2: schema.string.optional({}, [rules.maxLength(255)]),
  city: schema.string({}, [rules.maxLength(100)]),
  state: schema.string({}, [rules.maxLength(100)]),
  postalCode: schema.string({}, [rules.maxLength(20)]),
  country: schema.string({}, [rules.maxLength(100)]),
  shippingType: schema.string({}, [rules.maxLength(50)]),
  paymentMethod: schema.string({}, [rules.maxLength(50)]),
  items: schema.array([], [rules.minLength(1)]),
})

export const createProductSchema = schema.create({
  name: schema.string({}, [rules.maxLength(255)]),
  price: schema.number(),
  description: schema.string(),
  image: schema.string({}, [rules.url()]),
  stock: schema.number(),
  slug: schema.string({}, [rules.maxLength(255)]),
  sku: schema.string({}, [rules.maxLength(100)]),
})
