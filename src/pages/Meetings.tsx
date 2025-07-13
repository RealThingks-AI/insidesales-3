
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useMeetings } from '@/hooks/useMeetings';
import MeetingFormModal from '@/components/forms/MeetingFormModal';
import MeetingsTableRefactored from '@/components/MeetingsTableRefactored';
import MeetingColumnCustomizer from '@/components/MeetingColumnCustomizer';
import ActionsDropdown from '@/components/ActionsDropdown';
import { useBulkActions } from '@/hooks/useBulkActions';
import { useImportExport } from '@/hooks/useImportExport';
import { useBulkDelete } from '@/hooks/useBulkDelete';

interface MeetingColumn {
  key: string;
  label: string;
  visible: boolean;
  required?: boolean;
}

interface Meeting {
  id: string;
  meeting_title: string;
  date: string;
  start_time: string;
  duration: '15 min' | '30 min' | '1 hour' | '2 hours';
  location: 'Online' | 'In-Person';
  timezone: string;
  participants: string[];
  teams_link?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  organizer_name?: string;
  organizer_email?: string;
}

const Meetings = () => {
  const { meetings, loading, columns, setColumns, fetchMeetings } = useMeetings();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  // Removed viewMode state - using list view only

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);

  // Handle search on Enter key
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }
  };

  // Sort meetings to show upcoming ones first
  const sortedMeetings = [...meetings].sort((a, b) => {
    const dateTimeA = new Date(`${a.date}T${a.start_time}`);
    const dateTimeB = new Date(`${b.date}T${b.start_time}`);
    const now = new Date();
    
    // Check if meetings are upcoming (future) or past
    const aIsUpcoming = dateTimeA >= now;
    const bIsUpcoming = dateTimeB >= now;
    
    // Upcoming meetings first, then past meetings
    if (aIsUpcoming && !bIsUpcoming) return -1;
    if (!aIsUpcoming && bIsUpcoming) return 1;
    
    // Within each group, sort by date/time ascending
    return dateTimeA.getTime() - dateTimeB.getTime();
  });

  // Filter meetings based on search term
  const filteredMeetings = sortedMeetings.filter(meeting => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      meeting.meeting_title?.toLowerCase().includes(searchLower) ||
      meeting.location?.toLowerCase().includes(searchLower) ||
      meeting.participants?.some(p => p.toLowerCase().includes(searchLower))
    );
  });

  // Pagination logic
  const totalCount = filteredMeetings.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedMeetings = filteredMeetings.slice(startIndex, endIndex);

  const {
    selectedItems,
    isAllSelected,
    toggleSelectAll,
    toggleSelectItem,
    clearSelection,
    hasSelection
  } = useBulkActions(paginatedMeetings);

  const { handleBulkDelete, handleSingleDelete, isDeleting } = useBulkDelete({
    tableName: 'meetings',
    onRefresh: fetchMeetings,
    clearSelection
  });

  const { handleImport, handleExportAll, handleExportSelected, handleExportFiltered } = useImportExport({
    moduleName: 'Meetings',
    tableName: 'meetings',
    onRefresh: fetchMeetings
  });

  const handleBulkUpdateOwner = async (ids: string[], ownerId: string) => {
    console.log('Bulk update owner not implemented', { ids, ownerId });
  };

  const handleMeetingSuccess = () => {
    setShowMeetingModal(false);
    setSelectedMeeting(null);
    fetchMeetings();
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setShowMeetingModal(true);
  };

  const handleAddMeeting = () => {
    setSelectedMeeting(null);
    setShowMeetingModal(true);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    clearSelection();
  };

  const visibleColumns = columns.filter(col => col.visible);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600 mt-2">Schedule and manage your meetings ({totalCount} total)</p>
        </div>
        <div className="flex items-center space-x-3">
          <MeetingColumnCustomizer 
            columns={columns} 
            onColumnsChange={setColumns}
          />
          <Button onClick={handleAddMeeting}>
            <Plus className="h-4 w-4 mr-2" />
            Add Meeting
          </Button>
          <ActionsDropdown
            onImport={handleImport}
            onExportAll={() => handleExportAll(meetings, 'meetings')}
            onExportSelected={() => handleExportSelected(meetings, selectedItems, 'meetings')}
            onExportFiltered={() => handleExportFiltered(filteredMeetings, 'meetings')}
            onBulkDelete={handleBulkDelete}
            onBulkUpdateOwner={handleBulkUpdateOwner}
            hasSelected={hasSelection}
            hasFiltered={searchTerm.length > 0}
            selectedItems={selectedItems}
            moduleName="Meetings"
          />
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div className="relative w-96">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search meetings by title, location, or participants... (Press Enter to search)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            className="pl-10"
          />
        </div>
        
      </div>

      <MeetingsTableRefactored
        meetings={paginatedMeetings}
        visibleColumns={visibleColumns}
        onEditMeeting={handleEditMeeting}
        onDeleteMeeting={handleSingleDelete}
        onAddMeeting={handleAddMeeting}
        selectedItems={selectedItems}
        onToggleSelect={toggleSelectItem}
        isDeleting={isDeleting}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, totalCount)} of {totalCount} meetings
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={showMeetingModal} onOpenChange={setShowMeetingModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selectedMeeting ? 'Edit Meeting' : 'Add New Meeting'}</DialogTitle>
          </DialogHeader>
          <MeetingFormModal
            meeting={selectedMeeting}
            onSuccess={handleMeetingSuccess}
            onCancel={() => {
              setShowMeetingModal(false);
              setSelectedMeeting(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Meetings;
