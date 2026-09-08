'use client';

import { Check, Star } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function OrderFeedback({
  orderNumber,
  phone,
}: {
  orderNumber: string;
  phone?: string | null;
}) {
  const [foodRating, setFoodRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setSaving(true);
    setError('');
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber,
        phone,
        foodRating,
        serviceRating,
        notes,
      }),
    });
    const data = (await response.json()) as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(data.error || 'Rating could not be saved');
      return;
    }
    setSaved(true);
  }

  if (saved) {
    return (
      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 font-bold text-emerald-800">
        <span className="grid size-9 place-items-center rounded-full bg-emerald-600 text-white">
          <Check className="size-5" />
        </span>
        Thank you—your food and service rating is saved.
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-2xl border border-[#e0d4ca] bg-[#fffaf4] p-4">
      <h3 className="font-serif text-xl font-black">
        How was your experience?
      </h3>
      <p className="mt-1 text-sm text-[#786158]">
        Rate the food and restaurant service after your meal is served.
      </p>
      <RatingRow label="Food" value={foodRating} onChange={setFoodRating} />
      <RatingRow
        label="Service"
        value={serviceRating}
        onChange={setServiceRating}
      />
      <label className="mt-4 block space-y-2 text-sm font-bold">
        Note <span className="font-normal text-[#89746a]">(optional)</span>
        <Textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Tell us what you liked or what we should improve"
          className="min-h-20 bg-white"
        />
      </label>
      {error && <p className="mt-3 text-sm font-bold text-red-700">{error}</p>}
      <Button
        onClick={submit}
        disabled={saving || foodRating < 1 || serviceRating < 1}
        className="mt-4 w-full bg-[#6a2116] font-bold hover:bg-[#521008]"
      >
        {saving ? 'Saving rating…' : 'Submit rating'}
      </Button>
    </div>
  );
}

function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <span className="text-sm font-extrabold">{label}</span>
      <div
        className="flex gap-1"
        role="radiogroup"
        aria-label={`${label} rating`}
      >
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            role="radio"
            aria-checked={value === rating}
            aria-label={`${rating} out of 5`}
            className="rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6a2116]"
          >
            <Star
              className={`size-7 ${rating <= value ? 'fill-[#f6a81b] text-[#d68708]' : 'text-[#cbbdb2]'}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
