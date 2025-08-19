
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, Search, AlertTriangle, Activity, FileText, Filter } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  created_at: string;
}

const AuditLogsSettings = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    if (logs.length > 0) {
      fetchUserNames();
    }
  }, [logs]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, actionFilter]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      // Transform the data to match our AuditLog interface
      const transformedLogs: AuditLog[] = (data || []).map(log => ({
        id: log.id,
        user_id: log.user_id || '',
        action: log.action,
        resource_type: log.resource_type,
        resource_id: log.resource_id || undefined,
        details: log.details || undefined,
        ip_address: log.ip_address ? String(log.ip_address) : undefined,
        created_at: log.created_at
      }));

      setLogs(transformedLogs);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch audit logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserNames = async () => {
    try {
      // Get all unique user IDs from logs
      const uniqueUserIds = Array.from(new Set(
        logs.map(log => log.user_id).filter(Boolean)
      ));

      if (uniqueUserIds.length === 0) return;

      const { data, error } = await supabase.functions.invoke('fetch-user-display-names', {
        body: { userIds: uniqueUserIds }
      });
      
      if (error) throw error;
      setUserNames(data?.userDisplayNames || {});
    } catch (error) {
      console.error('Error fetching user names:', error);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by action type
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => {
        switch (actionFilter) {
          case 'user_management':
            return ['USER_CREATED', 'USER_DELETED', 'USER_ACTIVATED', 'USER_DEACTIVATED', 'ROLE_CHANGE', 'PASSWORD_RESET', 'ADMIN_ACTION'].includes(log.action) ||
                   log.action.includes('USER_') || 
                   log.action.includes('ROLE_') ||
                   log.resource_type === 'user_roles' ||
                   log.resource_type === 'profiles';
          case 'record_changes':
            return ['CREATE', 'UPDATE', 'DELETE', 'BULK_CREATE', 'BULK_UPDATE', 'BULK_DELETE'].includes(log.action) ||
                   ['contacts', 'deals', 'leads'].includes(log.resource_type);
          case 'authentication':
            return log.action.includes('SESSION_') || 
                   log.action.includes('LOGIN') || 
                   log.action.includes('LOGOUT') || 
                   log.action.includes('AUTH') ||
                   log.resource_type === 'auth';
          case 'export':
            return log.action.includes('EXPORT') || log.action.includes('DATA_EXPORT');
          default:
            return true;
        }
      });
    }

    // Special filtering for authentication logs to remove noise
    if (actionFilter === 'authentication') {
      filtered = deduplicateAuthLogs(filtered);
    }

    setFilteredLogs(filtered);
  };

  // Deduplicate authentication events - show only first/last login per day, max 5 entries per user per day
  const deduplicateAuthLogs = (authLogs: AuditLog[]) => {
    if (authLogs.length === 0) return authLogs;

    const sortedLogs = [...authLogs].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const uniqueLogs: AuditLog[] = [];
    const userDailyLogs = new Map<string, AuditLog[]>();

    // Group logs by user and day
    for (const log of sortedLogs) {
      const userId = log.user_id || 'system';
      const isAuthAction = log.action.includes('LOGIN') || log.action.includes('LOGOUT') || log.action.includes('SESSION_');
      
      // Always include non-auth actions
      if (!isAuthAction) {
        uniqueLogs.push(log);
        continue;
      }

      // Skip SESSION_ events as they are noise
      if (log.action.includes('SESSION_')) {
        continue;
      }

      const logDate = format(new Date(log.created_at), 'yyyy-MM-dd');
      const dailyKey = `${userId}-${logDate}`;
      
      if (!userDailyLogs.has(dailyKey)) {
        userDailyLogs.set(dailyKey, []);
      }
      
      userDailyLogs.get(dailyKey)!.push(log);
    }

    // Process each user's daily logs
    for (const [dailyKey, dailyLogs] of userDailyLogs.entries()) {
      // Sort by timestamp (newest first)
      dailyLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      const importantLogs: AuditLog[] = [];
      const loginLogs = dailyLogs.filter(log => log.action.includes('LOGIN'));
      const logoutLogs = dailyLogs.filter(log => log.action.includes('LOGOUT'));
      const otherLogs = dailyLogs.filter(log => 
        log.action.includes('PASSWORD') || 
        log.action.includes('RESET') || 
        log.action.includes('ACTIVATE') ||
        log.action.includes('DEACTIVATE')
      );

      // Add first and last login of the day
      if (loginLogs.length > 0) {
        // First login (chronologically earliest)
        const firstLogin = loginLogs[loginLogs.length - 1];
        importantLogs.push(firstLogin);
        
        // Last login (chronologically latest) - only if different from first
        if (loginLogs.length > 1) {
          const lastLogin = loginLogs[0];
          if (lastLogin.id !== firstLogin.id) {
            importantLogs.push(lastLogin);
          }
        }
      }

      // Add first logout of the day if it exists
      if (logoutLogs.length > 0) {
        importantLogs.push(logoutLogs[logoutLogs.length - 1]);
      }

      // Add important security events (password resets, etc.)
      importantLogs.push(...otherLogs);

      // Limit to maximum 5 entries per user per day
      const selectedLogs = importantLogs
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      uniqueLogs.push(...selectedLogs);
    }

    return uniqueLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const exportAuditTrail = async () => {
    try {
      const csvContent = [
        ['Timestamp', 'User ID', 'Action', 'Resource Type', 'Resource ID', 'IP Address', 'Details'].join(','),
        ...filteredLogs.map(log => [
          format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
          log.user_id || '',
          log.action,
          log.resource_type,
          log.resource_id || '',
          log.ip_address || '',
          JSON.stringify(log.details || {}).replace(/,/g, ';')
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-trail-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Audit trail exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export audit trail",
        variant: "destructive",
      });
    }
  };

  const getActionIcon = (action: string) => {
    // CRUD Operations
    if (action === 'CREATE' || action === 'BULK_CREATE') return <Activity className="h-4 w-4 text-green-600" />;
    if (action === 'UPDATE' || action === 'BULK_UPDATE') return <FileText className="h-4 w-4 text-blue-600" />;
    if (action === 'DELETE' || action === 'BULK_DELETE') return <AlertTriangle className="h-4 w-4 text-red-600" />;
    // User Management
    if (action.includes('USER')) return <Activity className="h-4 w-4" />;
    // Data Export
    if (action.includes('DATA') || action.includes('EXPORT')) return <Download className="h-4 w-4" />;
    // Session Management
    if (action.includes('SESSION')) return <Activity className="h-4 w-4 text-gray-500" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getActionBadgeVariant = (action: string) => {
    // CRUD Operations
    if (action === 'CREATE' || action === 'BULK_CREATE') return 'default';
    if (action === 'UPDATE' || action === 'BULK_UPDATE') return 'secondary';
    if (action === 'DELETE' || action === 'BULK_DELETE') return 'destructive';
    // User Management
    if (action.includes('CREATED') || action.includes('ACTIVATED')) return 'default';
    if (action.includes('DELETED') || action.includes('DEACTIVATED')) return 'destructive';
    if (action.includes('ROLE_CHANGE') || action.includes('PASSWORD_RESET')) return 'secondary';
    // Session Management
    if (action.includes('SESSION')) return 'outline';
    return 'outline';
  };

  const getReadableAction = (action: string) => {
    switch (action) {
      case 'CREATE': return 'Created Record';
      case 'UPDATE': return 'Updated Record';
      case 'DELETE': return 'Deleted Record';
      case 'BULK_CREATE': return 'Bulk Created Records';
      case 'BULK_UPDATE': return 'Bulk Updated Records';
      case 'BULK_DELETE': return 'Bulk Deleted Records';
      case 'SESSION_START': return 'User Login';
      case 'SESSION_END': return 'User Logout';
      case 'SESSION_ACTIVE': return 'Session Active';
      case 'SESSION_INACTIVE': return 'Session Inactive';
      default: return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getReadableResourceType = (resourceType: string) => {
    switch (resourceType) {
      case 'contacts': return 'Contacts';
      case 'leads': return 'Leads';
      case 'deals': return 'Deals';
      case 'auth': return 'Authentication';
      case 'user_roles': return 'User Roles';
      case 'profiles': return 'User Profiles';
      default: return resourceType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Security Audit Logs
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Track all security-related activities and user management actions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={fetchAuditLogs} variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportAuditTrail} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Trail
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search logs by action, resource, or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="record_changes">Record Changes</SelectItem>
                <SelectItem value="authentication">Authentication</SelectItem>
                <SelectItem value="user_management">User Management</SelectItem>
                <SelectItem value="export">Data Export</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Module/Resource</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const isAuthLog = log.action.includes('SESSION_') || log.action.includes('LOGIN') || log.action.includes('LOGOUT');
                    const userName = log.user_id ? (userNames[log.user_id] || `User ${log.user_id.substring(0, 8)}...`) : 'System';
                    
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(log.action)} className="flex items-center gap-1 w-fit">
                            {getActionIcon(log.action)}
                            {getReadableAction(log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {log.details?.module || getReadableResourceType(log.resource_type)}
                          </span>
                          {log.resource_id && !isAuthLog && (
                            <span className="text-muted-foreground text-sm block">
                              Record: {log.resource_id.substring(0, 8)}...
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{userName}</span>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {!isAuthLog && log.details?.field_changes && Object.keys(log.details.field_changes).length > 0 ? (
                            <div className="space-y-1">
                              {Object.entries(log.details.field_changes).slice(0, 3).map(([field, change]: [string, any]) => (
                                <div key={field} className="text-xs">
                                  <span className="font-medium">{field}:</span>
                                  <span className="text-muted-foreground"> {String(change.old || 'null')} → </span>
                                  <span className="text-primary">{String(change.new || 'null')}</span>
                                </div>
                              ))}
                              {Object.keys(log.details.field_changes).length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{Object.keys(log.details.field_changes).length - 3} more...
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {log.details && (
                            <details className="cursor-pointer">
                              <summary className="text-sm text-muted-foreground hover:text-foreground">
                                View details
                              </summary>
                              <pre className="text-xs mt-2 p-2 bg-muted rounded whitespace-pre-wrap">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {filteredLogs.length === 0 && (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm || actionFilter !== 'all' ? 'No logs match your filters' : 'No audit logs found'}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Log Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{logs.length}</div>
              <div className="text-sm text-muted-foreground">Total Events</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {logs.filter(log => log.action.includes('USER')).length}
              </div>
              <div className="text-sm text-muted-foreground">User Management</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {logs.filter(log => ['CREATE', 'UPDATE', 'DELETE', 'BULK_CREATE', 'BULK_UPDATE', 'BULK_DELETE'].includes(log.action)).length}
              </div>
              <div className="text-sm text-muted-foreground">Record Changes</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {logs.filter(log => log.action.includes('EXPORT')).length}
              </div>
              <div className="text-sm text-muted-foreground">Data Exports</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogsSettings;
