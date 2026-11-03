import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { API_URL } from '../../api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { bidStatusLabel, bidStatusVariant } from './bidStatus';

import {
  getCarrierToken as _getCarrierToken,
  getCarrierUser as _getCarrierUser,
  type CarrierSessionUser,
} from './carrierSession';

function getCarrierToken() {
  return _getCarrierToken();
}

function getCarrierUser(): Partial<CarrierSessionUser> {
  return _getCarrierUser() ?? {};
}

function carrierFetch(url: string, opts?: RequestInit) {
  const headers: Record<string, string> = {
    ...(opts?.headers as Record<string, string> | undefined),
    Authorization: `Bearer ${getCarrierToken()}`,
  };
  if (opts?.body != null) headers['Content-Type'] = 'application/json';
  return fetch(url, { ...opts, headers });
}

interface TenderOffer {
  id: string;
  status: string;
  expiresAt: string | null;
  tender: {
    id: string;
    reference: string;
    status: string;
    targetRate: number | null;
    equipmentType: string | null;
    tenderDurationMinutes: number;
    shipment: {
      reference: string;
      pickupDate: string | null;
      deliveryDate: string | null;
      origin: { city: string; state: string | null };
      destination: { city: string; state: string | null };
    };
  };
}

interface Bid {
  id: string;
  rate: number;
  status: string;
  rejectionReason: string | null;
  submittedAt: string;
  tender: { id: string; reference: string; status: string };
}

export default function CarrierDashboard() {
  const [offers, setOffers] = useState<TenderOffer[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!getCarrierToken()) {
      navigate('/carrier-portal/login');
      return;
    }
    Promise.all([
      carrierFetch(`${API_URL}/api/v1/carrier-portal/tenders`).then(r => r.json()),
      carrierFetch(`${API_URL}/api/v1/carrier-portal/bids`).then(r => r.json()),
    ]).then(([offersRes, bidsRes]) => {
      setOffers(offersRes.data || []);
      setBids(bidsRes.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <h3 className="text-lg font-medium">Loading...</h3>
      </div>
    );
  }

  const activeOffers = offers.filter(o => ['sent', 'viewed'].includes(o.status));
  const count = (status: string) => bids.filter(b => b.status === status).length;

  const stats = [
    { label: 'Open tenders', value: activeOffers.length, to: null },
    { label: 'Pending bids', value: count('submitted'), to: '/carrier-portal/bids?status=submitted' },
    { label: 'Won', value: count('accepted'), to: '/carrier-portal/bids?status=accepted' },
    { label: 'Not accepted', value: count('rejected'), to: '/carrier-portal/bids?status=rejected' },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <Card className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden sm:grid-cols-4 sm:divide-y-0">
        {stats.map(s => {
          const inner = (
            <>
              <div className="text-2xl font-semibold tabular-nums tracking-tight">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </>
          );
          return s.to ? (
            <Link key={s.label} to={s.to} className="p-5 hover:bg-muted/50">
              {inner}
            </Link>
          ) : (
            <div key={s.label} className="p-5">
              {inner}
            </div>
          );
        })}
      </Card>

      <Card>
        <CardHeader className="border-b border-border py-4">
          <CardTitle className="text-sm font-semibold">Open tenders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activeOffers.length === 0 ? (
            <div className="p-5 text-sm text-muted-foreground">No open tenders.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tender</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Offered rate</TableHead>
                  <TableHead>Respond within</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeOffers.map(offer => {
                  const t = offer.tender;
                  const mins = offer.expiresAt
                    ? Math.max(0, Math.floor((new Date(offer.expiresAt).getTime() - Date.now()) / 60000))
                    : null;
                  return (
                    <TableRow key={offer.id}>
                      <TableCell className="font-medium">{t.reference}</TableCell>
                      <TableCell className="text-sm">
                        {t.shipment.origin.city} to {t.shipment.destination.city}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {t.targetRate ? `$${t.targetRate.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className={cn('text-sm', mins !== null && mins < 30 && 'text-destructive')}>
                        {mins === null ? '-' : mins > 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" asChild>
                          <Link to={`/carrier-portal/tenders/${t.id}`}>Respond</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border py-4">
          <CardTitle className="text-sm font-semibold">Recent bids</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {bids.length === 0 ? (
            <div className="p-5 text-sm text-muted-foreground">No bids.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tender</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bids.slice(0, 6).map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">
                      <Link to={`/carrier-portal/tenders/${b.tender.id}`} className="hover:underline">
                        {b.tender.reference}
                      </Link>
                    </TableCell>
                    <TableCell className="tabular-nums">${b.rate.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={bidStatusVariant(b.status)}>{bidStatusLabel(b.status)}</Badge>
                      {b.rejectionReason && (
                        <div className="mt-1 max-w-md text-xs text-destructive">{b.rejectionReason}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(b.submittedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { carrierFetch, getCarrierToken, getCarrierUser };
