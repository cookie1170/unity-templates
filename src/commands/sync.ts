import { defineCommand, option } from '@bunli/core'
import { z } from 'zod'

export const syncCommand = defineCommand({
    name: 'sync',
    description: 'Add all the templates to installed Unity versions',
    options: {

    },
    handler: async ({flags, colors}) => {

    }
})