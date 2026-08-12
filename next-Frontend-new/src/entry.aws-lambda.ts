import { qwikCity } from '@builder.io/qwik-city/middleware/aws-lambda'
import { manifest } from './.qwikcity-manifest'
import render from './src/entry.server'

export const handler = qwikCity(render, manifest)
