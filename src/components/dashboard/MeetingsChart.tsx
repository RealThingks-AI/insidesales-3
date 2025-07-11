
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MeetingsChartProps {
  meetings: any[];
}

const MeetingsChart = ({ meetings }: MeetingsChartProps) => {
  // Group meetings by month for the last 6 months
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      value: date.getMonth(),
      year: date.getFullYear()
    };
  }).reverse();

  const meetingsByMonth = last6Months.map(({ month, value, year }) => {
    const count = meetings.filter(meeting => {
      const meetingDate = new Date(meeting.start_time);
      return meetingDate.getMonth() === value && meetingDate.getFullYear() === year;
    }).length;

    return {
      month,
      meetings: count
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Meetings Over Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={meetingsByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="meetings" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ fill: '#8b5cf6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MeetingsChart;
