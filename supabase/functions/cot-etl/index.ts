import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface COTRecord {
  contract: string
  report_date: string
  prod_class: string
  comm_long: number
  comm_short: number
  ls_long: number
  ls_short: number
  ss_long: number
  ss_short: number
  open_interest: number
}

interface ProcessedRecord extends COTRecord {
  contract_id: string
  comm_net: number
  ls_net: number
  ss_net: number
  comm_index?: number
  ls_index?: number
  ss_index?: number
  wow_comm_delta?: number
  wow_ls_delta?: number
  wow_ss_delta?: number
}

const CFTC_BASE = "https://www.cftc.gov/files/dea/history"
const START_YEAR = 2008
const LOOKBACK_WEEKS = 156

function pctRankLast(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const lastValue = values[values.length - 1]
  const rank = sorted.findIndex(v => v >= lastValue) + 1
  return (rank / sorted.length) * 100
}

async function downloadYear(year: number): Promise<COTRecord[]> {
  console.log(`Downloading data for year ${year}`)
  const url = `${CFTC_BASE}/fut_disagg_xls_${year}.zip`
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download ${year}: ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const zipBytes = new Uint8Array(arrayBuffer)
  
  // Note: In a real implementation, you'd need a ZIP parser for Deno
  // For now, we'll simulate the data structure
  console.log(`Downloaded ${zipBytes.length} bytes for ${year}`)
  
  // This is a placeholder - in reality you'd parse the Excel file from the ZIP
  // For demonstration, returning empty array
  return []
}

async function ingestYear(
  supabase: any,
  year: number,
  contractIds: Map<string, string>
): Promise<{ weekly: number; metrics: number }> {
  
  try {
    const records = await downloadYear(year)
    console.log(`Processing ${records.length} records for ${year}`)
    
    // Process contracts
    const uniqueContracts = [...new Set(records.map(r => r.contract))]
    for (const contractName of uniqueContracts) {
      if (!contractIds.has(contractName)) {
        const { data: existing } = await supabase
          .from('contracts')
          .select('id')
          .eq('name', contractName)
          .single()
        
        if (existing) {
          contractIds.set(contractName, existing.id)
        } else {
          const { data: newContract } = await supabase
            .from('contracts')
            .insert({ name: contractName })
            .select('id')
            .single()
          
          if (newContract) {
            contractIds.set(contractName, newContract.id)
          }
        }
      }
    }

    // Process raw records
    const processedRecords: ProcessedRecord[] = records.map(record => ({
      ...record,
      contract_id: contractIds.get(record.contract) || '',
      comm_net: record.comm_long - record.comm_short,
      ls_net: record.ls_long - record.ls_short,
      ss_net: record.ss_long - record.ss_short
    }))

    // Insert raw weekly data in chunks
    const chunkSize = 500
    let weeklyInserted = 0
    for (let i = 0; i < processedRecords.length; i += chunkSize) {
      const chunk = processedRecords.slice(i, i + chunkSize)
      const { error } = await supabase
        .from('cot_weekly')
        .upsert(chunk, { onConflict: 'contract_id,report_date' })
      
      if (error) {
        console.error('Error inserting weekly data:', error)
      } else {
        weeklyInserted += chunk.length
      }
    }

    // Calculate indices and deltas (simplified)
    const metricsRecords = processedRecords.map(record => ({
      contract_id: record.contract_id,
      report_date: record.report_date,
      comm_net: record.comm_net,
      ls_net: record.ls_net,
      ss_net: record.ss_net,
      comm_index: 50, // Simplified - would need rolling calculation
      ls_index: 50,
      ss_index: 50,
      wow_comm_delta: 0, // Simplified - would need previous week calculation
      wow_ls_delta: 0,
      wow_ss_delta: 0
    }))

    // Insert metrics data
    let metricsInserted = 0
    for (let i = 0; i < metricsRecords.length; i += chunkSize) {
      const chunk = metricsRecords.slice(i, i + chunkSize)
      const { error } = await supabase
        .from('cot_metrics')
        .upsert(chunk, { onConflict: 'contract_id,report_date' })
      
      if (error) {
        console.error('Error inserting metrics data:', error)
      } else {
        metricsInserted += chunk.length
      }
    }

    return { weekly: weeklyInserted, metrics: metricsInserted }
    
  } catch (error) {
    console.error(`Error processing year ${year}:`, error)
    return { weekly: 0, metrics: 0 }
  }
}

async function fullBackfill(supabase: any): Promise<any> {
  const startTime = new Date()
  let totalWeekly = 0
  let totalMetrics = 0
  const errors: string[] = []

  // Get existing contracts
  const { data: existingContracts } = await supabase
    .from('contracts')
    .select('id, name')
  
  const contractIds = new Map<string, string>()
  existingContracts?.forEach(contract => {
    contractIds.set(contract.name, contract.id)
  })

  const currentYear = new Date().getFullYear()
  
  for (let year = START_YEAR; year <= currentYear; year++) {
    try {
      const counts = await ingestYear(supabase, year, contractIds)
      totalWeekly += counts.weekly
      totalMetrics += counts.metrics
      console.log(`Year ${year} completed: ${JSON.stringify(counts)}`)
    } catch (error) {
      const errorMsg = `${year}: ${error.message}`
      errors.push(errorMsg)
      console.error(errorMsg)
    }
  }

  // Log the refresh
  await supabase.table('refresh_log').insert({
    rows_inserted: totalWeekly + totalMetrics,
    rows_updated: 0,
    error: errors.length > 0 ? errors.join('; ') : null
  })

  const duration = (new Date().getTime() - startTime.getTime()) / 1000

  return {
    status: errors.length === 0 ? 'completed' : 'partial',
    duration_seconds: duration,
    weekly_rows: totalWeekly,
    metric_rows: totalMetrics,
    errors
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    if (url.pathname === '/refresh/run') {
      console.log('Starting COT data backfill...')
      const result = await fullBackfill(supabase)
      
      return new Response(
        JSON.stringify({ status: 'success', result }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }
    
    if (url.pathname === '/refresh/status') {
      const { data } = await supabase
        .from('refresh_log')
        .select('*')
        .order('id', { ascending: false })
        .limit(1)
        .single()
      
      return new Response(
        JSON.stringify(data || { run_at: null, rows_inserted: 0, rows_updated: 0, error: null }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    if (url.pathname === '/cot/latest') {
      const { data } = await supabase
        .from('cot_latest')
        .select('*, contracts(name, sector)')
        .limit(3)
      
      return new Response(
        JSON.stringify(data || []),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not Found' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})