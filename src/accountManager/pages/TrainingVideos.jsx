import React, { useState } from 'react';
import { PlayCircle, Video, Search } from 'lucide-react';

export default function TrainingVideos() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dummy data representing videos fetched from the admin panel
  const videos = [
    { id: 1, title: 'Introduction to Solar Panels', category: 'Basics', duration: '12:30', thumbnail: 'https://via.placeholder.com/300x170?text=Solar+Basics' },
    { id: 2, title: 'How to pitch to a customer', category: 'Sales', duration: '15:45', thumbnail: 'https://via.placeholder.com/300x170?text=Sales+Pitch' },
    { id: 3, title: 'Understanding Inverters', category: 'Technical', duration: '22:10', thumbnail: 'https://via.placeholder.com/300x170?text=Inverters' },
    { id: 4, title: 'Account Manager Guidelines', category: 'Management', duration: '08:20', thumbnail: 'https://via.placeholder.com/300x170?text=Guidelines' },
  ];

  const filteredVideos = videos.filter(video => video.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Video className="mr-3 text-blue-600" size={28} />
            My Training Videos
          </h1>
          <p className="text-gray-600 mt-1">Videos assigned by the Admin Panel will appear here.</p>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search videos..." 
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredVideos.map((video) => (
          <div key={video.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
            <div className="relative">
              <img src={video.thumbnail} alt={video.title} className="w-full h-40 object-cover" />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <PlayCircle className="text-white w-12 h-12" />
              </div>
              <span className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                {video.duration}
              </span>
            </div>
            <div className="p-4">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{video.category}</span>
              <h3 className="font-semibold text-gray-800 mt-1 line-clamp-2">{video.title}</h3>
            </div>
          </div>
        ))}
      </div>

      {filteredVideos.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100 mt-4">
          <Video className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500 text-lg">No training videos found.</p>
        </div>
      )}
    </div>
  );
}
