import { useState, FormEvent } from 'react';

interface JobFormProps {
  onSubmit: (job: {
    title: string;
    pay: string;
    location: string;
    date: string;
    description?: string;
  }) => void;
}

export default function JobForm({ onSubmit }: JobFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    pay: '',
    location: '',
    date: '',
    description: '',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formData.title && formData.pay && formData.location && formData.date) {
      onSubmit(formData);
      setFormData({
        title: '',
        pay: '',
        location: '',
        date: '',
        description: '',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Job Title
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="e.g., Tomato Picker"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          💵 Pay
        </label>
        <input
          type="text"
          value={formData.pay}
          onChange={(e) => setFormData({ ...formData, pay: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="e.g., $12/hr"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📍 Location
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="e.g., Farm A, San Quintín"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📅 Date
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description (optional)
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-primary"
          rows={3}
          placeholder="Additional job details..."
        />
      </div>

      <button
        type="submit"
        className="w-full bg-primary text-white py-4 px-4 rounded-lg font-semibold text-lg hover:bg-green-600 transition-colors active:scale-95"
      >
        Post Job ✅
      </button>
    </form>
  );
}

