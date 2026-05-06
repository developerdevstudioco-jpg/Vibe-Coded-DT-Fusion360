import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';

export default function SupportCard() {
  return (
    <Card className="bg-[#ed1c24] text-white">
      <CardHeader>
        <CardTitle className="text-white">Need Help?</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm opacity-90 mb-4">
          Contact IT support for access issues or system errors use this <a href="mailto:supports@devstudioco.com">mailId:supports@devstudioco.com</a>
        </p>
        {/* <Button variant="secondary" className="w-full text-[#ed1c24] hover:bg-white/90">
          Contact Support
        </Button> */}
      </CardContent>
    </Card>
  );
}
