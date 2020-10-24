#!/usr/bin/env node
//@ts-check

// convert results to csv
// server/node_modules/.bin/json2csv -i for_kathy.json -o for_kathy.csv

const fs = require('fs')
const path = require('path')
const QueryStream = require('pg-query-stream')
const JSONStream = require('JSONStream')
const { getClient } = require('../db')

const DIRECTORY = process.argv[2] || './'

const tables = ['contributors', 'contributions', 'committees']

/**
 *
 * @param {import('pg').Client} client
 * @param {string} querystr
 */
const streamToFile = (client, querystr) =>
  new Promise((resolve, reject) => {
    const query = new QueryStream(querystr)
    const stream = client.query(query)

    stream.pipe(JSONStream.stringify()).pipe(process.stdout)
    stream.on('end', resolve)
    stream.on('error', reject)
  })

;(async () => {
  let client = null
  try {
    client = await getClient()
    client.query('select set_limit(0.6)')
    await streamToFile(
      client,
      `
      select * from contributions
      left join contributors c on contributions.contributor_id = c.id
      left join committees c2 on contributions.committee_name % c2.committee_name
    `
    )
  } catch (err) {
    console.error('Unable to copy from table', err)
  } finally {
    client.release()
  }
})()
