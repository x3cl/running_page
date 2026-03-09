// 在 return 的海报部分修改
<div className="bg-black p-8 rounded-3xl shadow-2xl mb-12 border border-gray-800">
  <div className="mb-8">
    <h2 className="text-4xl font-black italic text-white tracking-tighter uppercase">
      {year} ORGANIC FOOTPRINT WEB
    </h2>
    <p className="text-gray-500 font-mono text-xs mt-2 tracking-widest opacity-60">
      HYPER-CONNECTED TOPOLOGICAL HEATMAP
    </p>
  </div>
  
  {/* 使用新的 TrackWeb 组件 */}
  <TrackWeb activities={runs} />
  
  <div className="flex justify-start space-x-8 mt-8 opacity-50">
     <div className="flex items-center space-x-2">
       <div className="w-3 h-3 bg-[#ff5a5f] rounded-full"></div>
       <span className="text-[10px] text-gray-400 font-mono">ROAD</span>
     </div>
     <div className="flex items-center space-x-2">
       <div className="w-3 h-3 bg-[#2ecc71] rounded-full"></div>
       <span className="text-[10px] text-gray-400 font-mono">TRAIL (72%)</span>
     </div>
     <div className="flex items-center space-x-2">
       <div className="w-3 h-3 bg-[#00bfff] rounded-full"></div>
       <span className="text-[10px] text-gray-400 font-mono">SKI (42 DAYS)</span>
     </div>
  </div>
</div>