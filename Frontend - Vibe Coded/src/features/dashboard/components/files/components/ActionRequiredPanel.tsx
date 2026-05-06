import { AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { ActionItem } from '../types/dashboardTypes';

interface ActionRequiredPanelProps {
  items: ActionItem[];
}

export default function ActionRequiredPanel({ items }: ActionRequiredPanelProps) {
  return (
    <Card className="border-l-4 border-l-[#ed1c24] shadow-sm animate-in fade-in slide-in-from-top-2">
      <CardHeader className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#ed1c24]" />
            <CardTitle className="text-lg">Action Required</CardTitle>
          </div>
          <Badge variant="outline" className="text-[#ed1c24] border-[#ed1c24]">
            {items.length} Critical Items
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-4 pt-0">
        <div className="divide-y">
          {items.map(item => (
            <div
              key={item.id}
              className="py-3 flex items-center justify-between hover:bg-muted/30 px-2 -mx-2 rounded transition-colors cursor-pointer"
            >
              <div>
                <p className="font-medium text-sm">{item.title}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">{item.type}</Badge>
                  <span className="text-xs text-muted-foreground flex items-center">
                    <Clock className="w-3 h-3 mr-1" /> {item.due}
                  </span>
                </div>
              </div>
              <Button size="sm" variant="ghost">
                Take Action <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
