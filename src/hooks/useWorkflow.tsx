import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WorkflowRule {
  id: string;
  name: string;
  trigger: string;
  conditions: any[];
  actions: any[];
  isActive: boolean;
  createdAt: string;
}

interface WorkflowExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  status: 'success' | 'failed' | 'pending';
  executedAt: string;
  details: string;
}

export const useWorkflow = () => {
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false); // Added for backward compatibility
  const { toast } = useToast();

  const fetchRules = async () => {
    setIsLoading(true);
    setLoading(true);
    try {
      // Since we don't have a workflows table, we'll use mock data
      const mockRules: WorkflowRule[] = [
        {
          id: '1',
          name: 'New Lead Notification',
          trigger: 'lead_created',
          conditions: [{ field: 'lead_status', operator: 'equals', value: 'New' }],
          actions: [{ type: 'email', recipient: 'admin@example.com', subject: 'New lead created' }],
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Follow-up Reminder',
          trigger: 'contact_updated',
          conditions: [{ field: 'days_since_last_contact', operator: 'greater_than', value: 7 }],
          actions: [{ type: 'task', title: 'Follow up with contact', assignee: 'current_user' }],
          isActive: true,
          createdAt: new Date().toISOString(),
        }
      ];
      setRules(mockRules);
    } catch (error: any) {
      console.error('Error fetching workflow rules:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch workflow rules',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const fetchExecutions = async () => {
    try {
      // Mock execution data
      const mockExecutions: WorkflowExecution[] = [
        {
          id: '1',
          ruleId: '1',
          ruleName: 'New Lead Notification',
          status: 'success',
          executedAt: new Date().toISOString(),
          details: 'Email sent successfully to admin@example.com',
        },
        {
          id: '2',
          ruleId: '2',
          ruleName: 'Follow-up Reminder',
          status: 'success',
          executedAt: new Date(Date.now() - 86400000).toISOString(),
          details: 'Task created for follow-up',
        }
      ];
      setExecutions(mockExecutions);
    } catch (error: any) {
      console.error('Error fetching workflow executions:', error);
    }
  };

  const createRule = async (ruleData: Omit<WorkflowRule, 'id' | 'createdAt'>) => {
    try {
      // Mock creation - in real implementation, you'd save to database
      const newRule: WorkflowRule = {
        ...ruleData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      
      setRules(prev => [...prev, newRule]);
      
      toast({
        title: 'Success',
        description: 'Workflow rule created successfully',
      });
      
      return newRule;
    } catch (error: any) {
      console.error('Error creating workflow rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to create workflow rule',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateRule = async (id: string, updates: Partial<WorkflowRule>) => {
    try {
      setRules(prev => 
        prev.map(rule => 
          rule.id === id ? { ...rule, ...updates } : rule
        )
      );
      
      toast({
        title: 'Success',
        description: 'Workflow rule updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating workflow rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update workflow rule',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteRule = async (id: string) => {
    try {
      setRules(prev => prev.filter(rule => rule.id !== id));
      
      toast({
        title: 'Success',
        description: 'Workflow rule deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting workflow rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete workflow rule',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const executeRule = async (ruleId: string, triggerData: any) => {
    try {
      const rule = rules.find(r => r.id === ruleId);
      if (!rule || !rule.isActive) {
        return;
      }

      // Mock execution logic
      console.log('Executing workflow rule:', rule.name, 'with data:', triggerData);
      
      const execution: WorkflowExecution = {
        id: Date.now().toString(),
        ruleId,
        ruleName: rule.name,
        status: 'success',
        executedAt: new Date().toISOString(),
        details: `Rule executed successfully with trigger data: ${JSON.stringify(triggerData)}`,
      };
      
      setExecutions(prev => [execution, ...prev]);
      
      return execution;
    } catch (error: any) {
      console.error('Error executing workflow rule:', error);
      
      const execution: WorkflowExecution = {
        id: Date.now().toString(),
        ruleId,
        ruleName: rules.find(r => r.id === ruleId)?.name || 'Unknown',
        status: 'failed',
        executedAt: new Date().toISOString(),
        details: `Execution failed: ${error.message}`,
      };
      
      setExecutions(prev => [execution, ...prev]);
      
      throw error;
    }
  };

  // Added workflow stage and conversion functions for WorkflowActions compatibility
  const updateContactWorkflowStage = async (contactId: string, newStage: string) => {
    try {
      // Map the workflow stage to a valid lead_status enum value
      const validLeadStatuses = ['New', 'Qualified', 'Contacted', 'Proposal', 'Negotiation', 'Won', 'Lost'] as const;
      type LeadStatus = typeof validLeadStatuses[number];
      
      const mappedStage: LeadStatus = validLeadStatuses.includes(newStage as LeadStatus) 
        ? newStage as LeadStatus 
        : 'New';
      
      const { error } = await supabase
        .from('contacts')
        .update({ lead_status: mappedStage })
        .eq('id', contactId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Contact stage updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating contact stage:', error);
      toast({
        title: 'Error',
        description: 'Failed to update contact stage',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const convertContactToLead = async (contactId: string, leadData: any) => {
    try {
      // Insert into leads table
      const { error: leadError } = await supabase
        .from('leads')
        .insert({
          ...leadData,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (leadError) throw leadError;

      // Record the conversion
      const { error: conversionError } = await supabase
        .from('lead_conversions')
        .insert({
          contact_id: contactId,
          converted_by: (await supabase.auth.getUser()).data.user?.id,
          conversion_notes: 'Converted from contact',
        });

      if (conversionError) throw conversionError;

      toast({
        title: 'Success',
        description: 'Contact converted to lead successfully',
      });
    } catch (error: any) {
      console.error('Error converting contact to lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to convert contact to lead',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const convertLeadToDeal = async (leadId: string, dealData: any) => {
    try {
      const { error } = await supabase
        .from('deals')
        .insert({
          ...dealData,
          related_lead_id: leadId,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Lead converted to deal successfully',
      });
    } catch (error: any) {
      console.error('Error converting lead to deal:', error);
      toast({
        title: 'Error',
        description: 'Failed to convert lead to deal',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const sendEmailFromTemplate = async (contactId: string, templateId: string, customData: any) => {
    try {
      // Mock email sending functionality
      console.log('Sending email from template:', templateId, 'to contact:', contactId, 'with data:', customData);
      
      toast({
        title: 'Success',
        description: 'Email sent successfully',
      });
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send email',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchRules();
    fetchExecutions();
  }, []);

  return {
    rules,
    executions,
    isLoading,
    loading, // Added for backward compatibility
    createRule,
    updateRule,
    deleteRule,
    executeRule,
    updateContactWorkflowStage,
    convertContactToLead,
    convertLeadToDeal,
    sendEmailFromTemplate,
    refetch: () => {
      fetchRules();
      fetchExecutions();
    },
  };
};
