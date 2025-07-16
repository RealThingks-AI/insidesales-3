import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Deal {
  id?: string;
  deal_name: string;
  amount?: number;
  closing_date?: string;
  stage?: string;
  probability?: number;
  description?: string;
  currency?: string;
  
  // Lead information (for import purposes)
  lead_name?: string;
  lead_owner?: string;
  company_name?: string;
  
  // Discussions stage fields
  customer_need_identified?: boolean;
  need_summary?: string;
  decision_maker_present?: boolean;
  customer_agreed_on_need?: string;
  
  // Qualified stage fields
  nda_signed?: boolean;
  budget_confirmed?: string;
  supplier_portal_access?: string;
  expected_deal_timeline_start?: string;
  expected_deal_timeline_end?: string;
  budget_holder?: string;
  decision_makers?: string;
  timeline?: string;
  
  // RFQ stage fields
  rfq_value?: number;
  rfq_document_url?: string;
  product_service_scope?: string;
  rfq_confirmation_note?: string;
  
  // Offered stage fields
  proposal_sent_date?: string;
  negotiation_status?: string;
  decision_expected_date?: string;
  negotiation_notes?: string;
  
  // Final stage fields
  win_reason?: string;
  loss_reason?: string;
  drop_reason?: string;
  
  // Execution fields
  execution_started?: boolean;
  begin_execution_date?: string;
  
  // General fields
  internal_notes?: string;
  related_lead_id?: string;
  related_meeting_id?: string;
  created_by?: string;
  modified_by?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('deals-import-export function called');

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { action, data } = await req.json();
    console.log('Action:', action, 'Data keys:', Object.keys(data || {}));
    
    if (action === 'export') {
      // Export all deals with complete field mapping
      const { data: deals, error } = await supabaseClient
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Return deals with all fields for export
      return new Response(JSON.stringify({ 
        success: true, 
        data: deals,
        fields: [
          'id', 'deal_name', 'amount', 'closing_date', 'stage', 'probability', 
          'description', 'currency', 'customer_need_identified', 'need_summary',
          'decision_maker_present', 'customer_agreed_on_need', 'nda_signed',
          'budget_confirmed', 'supplier_portal_access', 'expected_deal_timeline_start',
          'expected_deal_timeline_end', 'budget_holder', 'decision_makers', 'timeline',
          'rfq_value', 'rfq_document_url', 'product_service_scope', 'rfq_confirmation_note',
          'proposal_sent_date', 'negotiation_status', 'decision_expected_date',
          'negotiation_notes', 'win_reason', 'loss_reason', 'drop_reason',
          'execution_started', 'begin_execution_date', 'internal_notes',
          'related_lead_id', 'related_meeting_id', 'created_at', 'modified_at'
        ]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'import') {
      const { deals: importDeals, userId } = data;
      
      console.log(`Processing import for ${importDeals?.length || 0} deals for user ${userId}`);
      
      if (!Array.isArray(importDeals)) {
        throw new Error('Invalid import data format');
      }

      const results = {
        created: 0,
        updated: 0,
        errors: [] as string[]
      };

      console.log(`Starting import of ${importDeals.length} deals`);

      for (const dealData of importDeals) {
        try {
          console.log(`Processing deal: ${dealData.deal_name} with ID: ${dealData.id || 'new'}`);
          
          // Validate required fields
          if (!dealData.deal_name) {
            results.errors.push('Missing required field: deal_name');
            continue;
          }

          // Validate stage if provided
          const validStages = ['Discussions', 'Qualified', 'RFQ', 'Offered', 'Won', 'Lost', 'Dropped'];
          if (dealData.stage && !validStages.includes(dealData.stage)) {
            console.log(`Invalid stage "${dealData.stage}" for deal "${dealData.deal_name}", defaulting to Discussions`);
            dealData.stage = 'Discussions'; // Default to Discussions for invalid stages
          }
          
          console.log(`Deal stage: ${dealData.stage || 'undefined'}`);

          // Validate boolean fields
          const booleanFields = ['customer_need_identified', 'decision_maker_present', 'nda_signed', 'execution_started'];
          booleanFields.forEach(field => {
            if (dealData[field] !== undefined) {
              dealData[field] = ['true', '1', 'yes', 'on'].includes(String(dealData[field]).toLowerCase());
            }
          });

          // Validate numeric fields
          const numericFields = ['amount', 'probability', 'rfq_value'];
          numericFields.forEach(field => {
            if (dealData[field] !== undefined && dealData[field] !== null && dealData[field] !== '') {
              const num = parseFloat(String(dealData[field]).replace(/[$,]/g, ''));
              dealData[field] = isNaN(num) ? null : num;
            }
          });

          // Handle probability bounds
          if (dealData.probability !== undefined && dealData.probability !== null) {
            dealData.probability = Math.max(0, Math.min(100, dealData.probability));
          }

          // Validate date fields
          const dateFields = ['closing_date', 'expected_deal_timeline_start', 'expected_deal_timeline_end', 
                            'proposal_sent_date', 'decision_expected_date', 'begin_execution_date'];
          dateFields.forEach(field => {
            if (dealData[field]) {
              const date = new Date(dealData[field]);
              dealData[field] = isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
            }
          });

          // Validate UUID fields
          const uuidFields = ['related_lead_id', 'related_meeting_id'];
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          uuidFields.forEach(field => {
            if (dealData[field] && !uuidRegex.test(dealData[field])) {
              dealData[field] = null;
            }
          });

          // Set system fields
          const now = new Date().toISOString();
          let existingDeal = null;
          
          // First check by ID if provided
          if (dealData.id) {
            console.log(`Checking if deal exists with ID: ${dealData.id}`);
            const { data } = await supabaseClient
              .from('deals')
              .select('id, deal_name, stage')
              .eq('id', dealData.id)
              .maybeSingle();
            existingDeal = data;
          }
          
          // If no ID match, check for duplicate by deal_name + stage
          if (!existingDeal) {
            console.log(`Checking for duplicate deal: "${dealData.deal_name}" with stage: "${dealData.stage || 'Discussions'}"`);
            const { data } = await supabaseClient
              .from('deals')
              .select('id, deal_name, stage')
              .eq('deal_name', dealData.deal_name)
              .eq('stage', dealData.stage || 'Discussions')
              .maybeSingle();
            existingDeal = data;
          }

          if (existingDeal) {
            console.log(`Updating existing deal: ${dealData.deal_name} (ID: ${existingDeal.id})`);
            // Update existing deal with all fields from import
            const updateData = { ...dealData };
            delete updateData.id; // Remove ID from update data
            
            // Remove lead information fields as they're not database fields
            delete updateData.lead_name;
            delete updateData.lead_owner;
            delete updateData.company_name;
            
            updateData.modified_at = now;
            updateData.modified_by = userId;
            
            const { error } = await supabaseClient
              .from('deals')
              .update(updateData)
              .eq('id', existingDeal.id);

            if (error) throw error;
            results.updated++;
          } else {
            console.log(`Creating new deal: ${dealData.deal_name} with stage: ${dealData.stage || 'Discussions'}`);
            // Create new deal - only set stage to Discussions if not provided
            const insertData = { ...dealData };
            delete insertData.id; // Remove ID to let DB generate it
            
            // Remove lead information fields as they're not database fields
            delete insertData.lead_name;
            delete insertData.lead_owner;
            delete insertData.company_name;
            
            insertData.created_at = now;
            insertData.created_by = userId;
            insertData.modified_at = now;
            insertData.modified_by = userId;
            insertData.stage = dealData.stage || 'Discussions';
            
            const { error } = await supabaseClient
              .from('deals')
              .insert(insertData);

            if (error) throw error;
            results.created++;
          }

        } catch (error: any) {
          console.error('Error processing deal:', error);
          results.errors.push(`Deal "${dealData.deal_name || 'Unknown'}": ${error.message}`);
        }
      }

      console.log(`Import completed: Created ${results.created}, Updated ${results.updated}, Errors ${results.errors.length}`);

      return new Response(JSON.stringify({ 
        success: true, 
        results 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in deals-import-export function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});