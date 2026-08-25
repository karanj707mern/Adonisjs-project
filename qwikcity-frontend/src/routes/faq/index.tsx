import { component$ } from "@builder.io/qwik";
import { InfoPage } from "~/components/info-page";

const FAQ_ITEMS = [
  {
    question: "What is Moringa?",
    answer:
      "Moringa is a nutrient-rich plant native to India and Africa. Often called the 'miracle tree,' every part of the plant is edible and packed with vitamins, minerals, and antioxidants.",
  },
  {
    question: "How do I consume Moringa powder?",
    answer:
      "Mix 1-2 teaspoons of Moringa powder into smoothies, juices, soups, or warm water. You can also sprinkle it over salads or mix into yogurt. Start with a small amount and gradually increase.",
  },
  {
    question: "What are the health benefits?",
    answer:
      "Moringa is rich in vitamin A, C, E, calcium, potassium, and protein. It supports energy levels, immune function, healthy digestion, and has anti-inflammatory properties.",
  },
  {
    question: "How should I store Moringa products?",
    answer:
      "Store Moringa powder in a cool, dry place away from direct sunlight. Keep the container tightly sealed. Refrigeration can extend shelf life but is not required.",
  },
  {
    question: "Do you offer free shipping?",
    answer:
      "Yes! We offer free standard shipping on all orders above ₹499 within India. Standard delivery takes 5-7 business days.",
  },
  {
    question: "What is your return policy?",
    answer:
      "We accept returns within 7 days of delivery if the product is unopened and in original packaging. Please contact our support team to initiate a return.",
  },
  {
    question: "Are your products organic?",
    answer:
      "Yes, all our Moringa products are 100% organic, sourced from certified organic farms. We use no pesticides or chemical fertilizers.",
  },
  {
    question: "How can I track my order?",
    answer:
      "Once your order is shipped, you'll receive a tracking link via email. You can also check your order status in the 'My Orders' section of your account.",
  },
];

export default component$(() => {
  return (
    <InfoPage title="Frequently Asked Questions">
      <div class="space-y-6">
        {FAQ_ITEMS.map((item, idx) => (
          <div
            key={idx}
            class="rounded-xl border border-slate-200 p-5 dark:border-slate-800"
          >
            <h3 class="font-semibold text-slate-900 dark:text-slate-100">
              {item.question}
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {item.answer}
            </p>
          </div>
        ))}
      </div>
    </InfoPage>
  );
});
