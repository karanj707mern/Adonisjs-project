import { createQwikCity } from '@builder.io/qwik-city/middleware/node-http'
import render from './src/entry.server'
import { manifest } from './.qwikcity-manifest'

export const { onRequest, onGet, onPost, onPut, onDelete, onPatch, onHead, onOptions, onConnect, onTrace } =
  createQwikCity({ render, manifest })
