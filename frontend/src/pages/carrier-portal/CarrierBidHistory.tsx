import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { API_URL } from '../../api';
import { carrierFetch, getCarrierToken } from './CarrierDashboard';
import { bidStatusLabel, bidStatusVariant } from './bidStatus';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Bid {
  id: string;
  rate: number;
  currency: string;
  transitDays: number | null;
  status: string;
  rejectionReason: string | null;
  submittedAt: string;
  tender: { id: string; reference: string; status: string };
}

const FILTERS: { status: string | null; label: string }[] = [
  { status: null, label: 'All' },
  { status: 'submitted', label: 'Pending' },
  { status: 'accepted', label: 'Won' },
  { status: 'rejected', label: 'Not accepted' },
];

export default function CarrierBidHistory() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const filter = params.get('status');

  useEffect(() => {
    if (!getCarrierToken()) {
      navigate('/carrier-portal/login');
      return;
    }
    carrierFetch(`${API_URL}/api/v1/carrier-portal/bids`)
      .then(r => r.json())
      .then(json => {
        setBids(json.data || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const shown = filter ? bids.filter(b => b.status === filter) : bids;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Bids</h1>
        <div className="flex gap-1 text-sm">
          {FILTERS.map(f => (
            <button
              key={f.label}
              onClick={() => setParams(f.status ? { status: f.status } : {})}
              className={`rounded-md px-3 py-1.5 font-medium ${
                filter === f.status ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tender</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Transit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No bids.
                </TableCell>
              </TableRow>
            ) : shown.map(b => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">
                  <Link to={`/carrier-portal/tenders/${b.tender.id}`} className="hover:underline">
                    {b.tender.reference}
                  </Link>
                </TableCell>
                <TableCell className="tabular-nums">${b.rate.toLocaleString()}</TableCell>
                <TableCell className="text-sm">{b.transitDays ? `${b.transitDays} d` : '-'}</TableCell>
                <TableCell>
                  <Badge variant={bidStatusVariant(b.status)}>{bidStatusLabel(b.status)}</Badge>
                  {b.rejectionReason && (
                    <div className="mt-1 max-w-md text-xs text-destructive">{b.rejectionReason}</div>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(b.submittedAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
