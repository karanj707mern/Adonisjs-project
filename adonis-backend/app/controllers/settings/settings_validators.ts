import vine from '@vinejs/vine'

export const updateStoreSettingsValidator = vine.compile(
  vine.object({
    shippingCharge: vine.number().min(0),
    expressShippingCharge: vine.number().min(0),
    sameDayShippingCharge: vine.number().min(0),
    codCharge: vine.number().min(0),
    handlingCharge: vine.number().min(0),
    taxRate: vine.number().min(0),
    freeShippingThreshold: vine.number().min(0).optional().nullable(),
    shippingZones: vine
      .array(
        vine.object({
          key: vine.string(),
          label: vine.string(),
          countries: vine.array(vine.string()),
          allowedShippingTypes: vine.array(vine.string()),
          taxRate: vine.number().min(0).optional().nullable(),
          shippingMultiplier: vine.number().min(0).optional().nullable(),
        })
      )
      .optional(),
    codEnabled: vine.boolean().optional(),
    maxCodOrderValue: vine.number().min(0).optional().nullable(),
    allowInternationalCod: vine.boolean().optional(),
    autoCancelPendingMinutes: vine.number().min(5).optional(),
  })
)
