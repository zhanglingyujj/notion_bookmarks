'use client';

import { Link } from '@/types';
import { motion } from 'framer-motion';
import { IconExternalLink } from '@tabler/icons-react';
import React, { useState, useEffect, memo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface LinkCardProps {
  link: Link;
  className?: string;
}

// 提示框组件 - 保持不变，可以考虑提取但此处暂保留
function Tooltip({ content, show, x, y }: { content: string; show: boolean; x: number; y: number }) {
  if (!show) return null;
  
  // 确保在客户端环境中执行
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  
  return createPortal(
    <div 
      className="fixed p-2 rounded-lg bg-popover/95 backdrop-blur supports-[backdrop-filter]:bg-popover/85
                border shadow-lg max-w-xs z-[100] pointer-events-none
                animate-in fade-in zoom-in-95 duration-200"
      style={{ 
        left: x,
        top: y - 8,
        transform: 'translateY(-100%)'
      }}
    >
      <p className="text-sm text-popover-foreground whitespace-normal">{content}</p>
    </div>,
    document.body
  );
}

// 获取图标URL的辅助函数
function getIconUrl(link: Link): string {
  // 最优先使用iconfile
  if (link.iconfile) {
    return link.iconfile;
  }
  
  // 次优先级使用iconlink
  if (link.iconlink) {
    return link.iconlink;
  }
  
  // 如果都没有，直接使用默认图标
  return '/globe.svg';
}

// 分离 Image 组件以避免整个 LinkCard 重渲染
const OptimisedLinkIcon = memo(function OptimisedLinkIcon({ 
  src, 
  alt, 
  onLoad, 
  onError 
}: { 
  src: string; 
  alt: string; 
  onLoad?: () => void; 
  onError: () => void;
}) {
    return (
        <img
            src={src}
            alt={alt}
            className={cn(
                "w-full h-full object-contain transition-opacity duration-200"
            )}
            onLoad={onLoad}
            onError={onError}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
        />
    );
}, (prev, next) => prev.src === next.src);


const LinkCard = memo(function LinkCard({ link, className }: LinkCardProps) {
  const [titleTooltip, setTitleTooltip] = useState({ show: false, x: 0, y: 0 });
  const [descTooltip, setDescTooltip] = useState({ show: false, x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(getIconUrl(link));

    // 使用 useCallback 优化事件处理
    const handleImageError = useCallback(() => {
        setImageSrc('/globe.svg');
        setImageLoaded(true);
    }, []);

    const handleImageLoad = useCallback(() => {
        setImageLoaded(true);
    }, []);

  const handleMouseEnter = useCallback((
    event: React.MouseEvent<HTMLElement>,
    isTitle: boolean
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const setter = isTitle ? setTitleTooltip : setDescTooltip;
    setter({
      show: true,
      x: rect.left,
      y: rect.top
    });
  }, []);

  const handleMouseLeave = useCallback((isTitle: boolean) => {
      const setter = isTitle ? setTitleTooltip : setDescTooltip;
    setter({ show: false, x: 0, y: 0 });
  }, []);

  // 当 link 变化时更新图片源
  useEffect(() => {
    setImageSrc(getIconUrl(link));
    setImageLoaded(false);
  }, [link]);

  return (
    <>
    <motion.a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "group block p-4 rounded-xl border border-border/50 bg-card hover:border-primary/50 transition-all",
          "hover:shadow-lg hover:shadow-primary/5",
          "w-full max-w-full",
          className
        )}
      >
        {/* 内容容器 */}
        <div className="flex flex-col h-full gap-2">
          {/* 图标和名称行 */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* 图标容器 */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="relative w-10 h-10 rounded-xl overflow-hidden transition-all shrink-0
                       bg-muted/50 p-1.5 border border-border/50"
            >
              <div className="icon-container relative w-full h-full">
                <OptimisedLinkIcon 
                    src={imageSrc} 
                    alt={link.name} 
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                />
                 
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                    <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </motion.div>
            
            {/* 网站名称和图标 */}
            <div className="flex-1 min-w-0 relative">
              <div 
                className="relative"
                onMouseEnter={(e) => handleMouseEnter(e, true)}
                onMouseLeave={() => handleMouseLeave(true)}
              >
                <h3 className="text-lg text-foreground
                               group-hover:text-primary
                               transition-colors line-clamp-1 pr-6">
                  {link.name}
                </h3>
              </div>
              {/* 固定位置的外链图标 */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                <IconExternalLink 
                  className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" 
                />
              </div>
            </div>
          </div>

          {/* 描述行 */}
          {link.desc && (
            <div 
              className="relative flex-1 min-h-0"
              onMouseEnter={(e) => handleMouseEnter(e, false)}
              onMouseLeave={() => handleMouseLeave(false)}
            >
              <p className="text-sm text-foreground/80
                         group-hover:text-foreground
                         line-clamp-2 transition-colors">
                {link.desc}
              </p>
            </div>
          )}

          {/* 标签行 - 放在底部 */}
          {link.tags && link.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 flex-shrink-0">
              {link.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 text-xs rounded-md
                           bg-muted/40 text-muted-foreground
                           group-hover:bg-primary/10 group-hover:text-primary/90
                           transition-colors"
                  title={tag}
                >
                  <span className="truncate max-w-[80px]">{tag}</span>
                </span>
              ))}
              {link.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-md
                              bg-muted/40 text-muted-foreground
                              group-hover:bg-primary/10 group-hover:text-primary/90
                              transition-colors shrink-0"
                >
                  +{link.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 渐变悬浮效果 */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-transparent via-transparent to-transparent
                      group-hover:from-primary/5 group-hover:via-primary/2 group-hover:to-transparent
                      transition-colors duration-500" />
      </motion.a>

      {/* 提示框 */}
      <Tooltip 
        content={link.name}
        show={titleTooltip.show}
        x={titleTooltip.x}
        y={titleTooltip.y}
      />
      {link.desc && (
        <Tooltip 
          content={link.desc}
          show={descTooltip.show}
          x={descTooltip.x}
          y={descTooltip.y}
        />
      )}
    </>
  );
}, (prev, next) => {
    // Custom comparison function for React.memo
    // Only re-render if key props change
    return (
        prev.link.id === next.link.id &&
        prev.link.name === next.link.name &&
        prev.link.desc === next.link.desc &&
        prev.link.url === next.link.url &&
        prev.link.iconfile === next.link.iconfile &&
        prev.link.iconlink === next.link.iconlink &&
        prev.className === next.className
    );
});

export default LinkCard;