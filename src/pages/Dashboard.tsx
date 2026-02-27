import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Search, Filter, FileText, Video, Image as ImageIcon, Download, Eye, File } from "lucide-react";
import { format } from "date-fns";

interface DashboardProps {
  isSmartPanelMode: boolean;
}

interface ContentItem {
  public_id: string;
  secure_url: string;
  created_at: string;
  resource_type: string;
  format: string;
  context?: {
    custom?: {
      title?: string;
      teacher?: string;
      subject?: string;
      class?: string;
      description?: string;
      fileType?: string;
    }
  }
}

export default function Dashboard({ isSmartPanelMode }: DashboardProps) {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedType, setSelectedType] = useState("All");

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/content");
      const data = await res.json();
      if (data.resources) {
        setContent(data.resources);
      }
    } catch (error) {
      console.error("Failed to fetch content", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContent = content.filter((item) => {
    const meta = item.context?.custom || {};
    const title = meta.title || item.public_id;
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === "All" || meta.class === selectedClass;
    const matchesSubject = selectedSubject === "All" || meta.subject === selectedSubject;
    const matchesType = selectedType === "All" || meta.fileType === selectedType;
    
    return matchesSearch && matchesClass && matchesSubject && matchesType;
  });

  const getFileIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "pdf": return <FileText className="w-6 h-6 text-red-400" />;
      case "video": return <Video className="w-6 h-6 text-blue-400" />;
      case "image": return <ImageIcon className="w-6 h-6 text-green-400" />;
      case "ppt": return <File className="w-6 h-6 text-orange-400" />;
      default: return <File className="w-6 h-6 text-gray-400" />;
    }
  };

  const gridCols = isSmartPanelMode 
    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" 
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6";

  return (
    <motion.div 
      initial={{ opacity: 0, filter: "blur(10px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, filter: "blur(10px)" }}
      transition={{ duration: 0.5 }}
      className="p-6 md:p-10 max-w-[1600px] mx-auto pb-32"
    >
      {/* Hero Section */}
      <div className="mb-12 text-center md:text-left">
        <motion.h2 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl md:text-5xl font-display font-bold mb-4"
        >
          Smart Classroom <span className="text-gradient">Content Hub</span>
        </motion.h2>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "100px" }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="h-1 bg-gradient-to-r from-[#00F0FF] to-[#B026FF] rounded-full md:mx-0 mx-auto"
        />
      </div>

      {/* Filter Section */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="glass-panel rounded-2xl p-6 mb-10 flex flex-col md:flex-row gap-4 items-center justify-between border border-white/10 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#00F0FF]/5 to-[#B026FF]/5 pointer-events-none"></div>
        
        <div className="relative w-full md:w-1/3 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400 group-focus-within:text-[#00F0FF] transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Search content..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-4 py-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent text-white focus:outline-none text-sm appearance-none cursor-pointer"
            >
              <option value="All">All Classes</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 11">Class 11</option>
              <option value="Class 12">Class 12</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-4 py-2">
            <select 
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-transparent text-white focus:outline-none text-sm appearance-none cursor-pointer"
            >
              <option value="All">All Subjects</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="Computer Science">Computer Science</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-4 py-2">
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent text-white focus:outline-none text-sm appearance-none cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="PDF">PDF</option>
              <option value="Video">Video</option>
              <option value="PPT">PPT</option>
              <option value="Image">Image</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Content Grid */}
      {loading ? (
        <div className={`grid ${gridCols}`}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-panel rounded-2xl h-72 animate-pulse border border-white/5 relative overflow-hidden">
               <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            </div>
          ))}
        </div>
      ) : filteredContent.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-32 h-32 mb-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10 relative">
             <div className="absolute inset-0 rounded-full border border-[#00F0FF]/30 animate-ping"></div>
             <FileText className="w-12 h-12 text-gray-500" />
          </div>
          <h3 className="text-2xl font-display font-medium text-gray-300 mb-2">No Content Found</h3>
          <p className="text-gray-500">Try adjusting your filters or upload new content.</p>
        </motion.div>
      ) : (
        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
          initial="hidden"
          animate="show"
          className={`grid ${gridCols}`}
        >
          {filteredContent.map((item) => {
            const meta = item.context?.custom || {};
            const title = meta.title || "Untitled Document";
            const fileType = meta.fileType || "Unknown";
            const date = new Date(item.created_at);

            return (
              <motion.div 
                key={item.public_id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="glass-panel rounded-2xl overflow-hidden border border-white/10 group hover:border-[#00F0FF]/50 transition-all duration-300 relative flex flex-col"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#00F0FF]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="h-40 bg-black/50 relative flex items-center justify-center overflow-hidden border-b border-white/5">
                  {item.resource_type === 'image' ? (
                    <img src={item.secure_url} alt={title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                  ) : item.resource_type === 'video' ? (
                    <video src={item.secure_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                  ) : (
                    <div className="transform group-hover:scale-110 transition-transform duration-500">
                      {getFileIcon(fileType)}
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10 flex items-center gap-2">
                    {getFileIcon(fileType)}
                    {fileType}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col relative z-10">
                  <h3 className="font-display font-semibold text-lg mb-1 truncate text-white group-hover:text-[#00F0FF] transition-colors">{title}</h3>
                  <p className="text-sm text-gray-400 mb-4 truncate">{meta.subject} • {meta.class}</p>
                  
                  <div className="mt-auto flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>By {meta.teacher || "Unknown"}</span>
                    <span>{format(date, "MMM d, yyyy")}</span>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                    <a 
                      href={item.secure_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 py-2 rounded-xl transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" /> View
                    </a>
                    <a 
                      href={item.secure_url.replace('/upload/', '/upload/fl_attachment/')} 
                      download
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#00F0FF]/20 to-[#B026FF]/20 hover:from-[#00F0FF]/40 hover:to-[#B026FF]/40 border border-[#00F0FF]/30 py-2 rounded-xl transition-all duration-300 text-sm font-medium text-white"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
