import React, { useState, useRef } from 'react';
import {
  Send,
  Paperclip,
  Code2,
  Mic,
  Smile,
  X,
  Sparkles,
  FileCode
} from 'lucide-react';
import { useChatStore } from '../../entities/chat/chatStore';
import { useUserStore } from '../../entities/user/userStore';

interface ChatInputProps {
  channelId: string;
  channelName: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ channelId, channelName }) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { sendMessage, replyingToMessage, setReplyingToMessage } = useChatStore();
  const { currentUser } = useUserStore();

  const handleSend = () => {
    if (!content.trim() && attachments.length === 0) return;

    sendMessage(
      channelId,
      currentUser,
      content,
      attachments,
      replyingToMessage
        ? {
            id: replyingToMessage.id,
            authorName: replyingToMessage.author.displayName,
            contentSnippet: replyingToMessage.content.slice(0, 60)
          }
        : undefined
    );

    setContent('');
    setAttachments([]);
    setReplyingToMessage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addSampleCodeSnippet = () => {
    setContent(
      (prev) =>
        prev +
          `\n\`\`\`typescript\n// Pulse spatial audio node hook\nconst useSpatialAudio = (bitrate = 320) => {\n  return { latencyMs: 14, krispEnabled: true };\n};\n\`\`\`\n`
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        let fileType = 'file';
        if (file.type.startsWith('image/')) {
          fileType = 'image';
        } else if (file.type.startsWith('audio/')) {
          fileType = 'audio';
        } else if (file.type.startsWith('video/')) {
          fileType = 'video';
        }

        setAttachments([
          {
            id: `att-${Date.now()}`,
            type: fileType,
            name: file.name,
            url: event.target.result as string
          }
        ]);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const quickEmojis = ['🔥', '🎯', '👑', '⚡', '💯', '🎮', '🚀', '🧠'];

  return (
    <div className="p-4 bg-slate-900 border-t border-slate-800/80 flex flex-col gap-2 relative">
      {/* Reply Snippet Banner */}
      {replyingToMessage && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-white">
              Replying to {replyingToMessage.author.displayName}:
            </span>
            <span className="truncate italic text-slate-300">
              "{replyingToMessage.content}"
            </span>
          </div>
          <button
            onClick={() => setReplyingToMessage(null)}
            className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Attachments Preview Bar */}
      {attachments.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="relative group rounded-lg overflow-hidden border border-slate-700 w-24 h-16 bg-slate-800 flex flex-col justify-center items-center p-1 text-center"
            >
              {att.type === 'image' ? (
                <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <FileCode className="w-6 h-6 text-indigo-400 mb-0.5" />
                  <span className="text-[9px] text-slate-300 truncate w-20 px-1 font-mono">{att.name}</span>
                </div>
              )}
              <button
                onClick={() => setAttachments([])}
                className="absolute top-1 right-1 p-0.5 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Field Container */}
      <div className="relative flex items-center bg-slate-950 border border-slate-800 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/50 rounded-xl transition-all duration-200">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*,video/*,audio/*,application/*,text/*"
          onChange={handleFileChange}
        />

        <button
          onClick={triggerFileInput}
          title="Attach real file or media"
          className="p-2.5 text-slate-400 hover:text-indigo-400 transition-colors ml-1 cursor-pointer"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${channelName} (Markdown supported)...`}
          className="flex-1 bg-transparent border-none text-slate-100 placeholder-slate-500 text-sm focus:outline-none px-2 py-3"
        />

        {/* Action Icons */}
        <div className="flex items-center gap-1 mr-2">
          <button
            onClick={addSampleCodeSnippet}
            title="Insert Code Snippet"
            className="p-1.5 text-slate-400 hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-900"
          >
            <Code2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Reactions & Emojis"
            className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors rounded-lg hover:bg-slate-900 relative"
          >
            <Smile className="w-4 h-4" />
          </button>

          <button
            onClick={handleSend}
            disabled={!content.trim() && attachments.length === 0}
            className={`
              p-2 rounded-lg text-white transition-all duration-150 flex items-center justify-center
              ${
                content.trim() || attachments.length > 0
                  ? 'bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }
            `}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 right-4 bg-slate-900 border border-slate-700/80 rounded-xl p-3 shadow-2xl z-30 flex items-center gap-1.5">
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setContent((prev) => prev + emoji);
                setShowEmojiPicker(false);
              }}
              className="text-lg hover:scale-125 transition-transform p-1.5 hover:bg-slate-800 rounded-lg"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
