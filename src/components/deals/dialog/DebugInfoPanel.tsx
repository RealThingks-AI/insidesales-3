interface DebugInfoPanelProps {
  debugInfo: string;
}

export const DebugInfoPanel = ({ debugInfo }: DebugInfoPanelProps) => {
  if (!debugInfo) return null;

  return (
    <div className="bg-blue-50 p-2 rounded text-xs text-blue-700 font-mono">
      Debug: {debugInfo}
    </div>
  );
};