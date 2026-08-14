'use client'
import { useState, useEffect } from 'react'

export default function GiftCardsPage() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/gift-card')
      .then((r) => r.ok ? r.json() : [])
      .then(setCards)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-6">Gift Cards</h1>
      {loading ? (
        <p className="text-stone-600 dark:text-stone-400">Loading...</p>
      ) : cards.length === 0 ? (
        <p className="text-stone-600 dark:text-stone-400">No gift cards available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card: any) => (
            <div key={card.id} className="bg-white dark:bg-stone-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">{card.code}</h3>
              <p className="text-emerald-700 dark:text-emerald-400 font-bold text-xl">₹{card.balance}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
