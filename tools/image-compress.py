#!/usr/bin/env python3
"""
图片批量压缩工具
龙虾工坊免费工具

功能：
- 批量压缩指定目录下的图片
- 支持常见格式：JPG, PNG, WEBP
- 保持宽高比
- 可指定最大宽度和质量

使用方法：
python image-compress.py <输入目录> [输出目录] [--width 宽度] [--quality 质量]

示例：
python image-compress.py ./photos ./compressed --width 1920 --quality 85
"""

import os
import sys
import argparse
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("请先安装 Pillow: pip install Pillow")
    sys.exit(1)


def compress_image(input_path, output_path, max_width=1920, quality=85):
    """压缩单张图片"""
    try:
        with Image.open(input_path) as img:
            # 保持宽高比缩放
            if img.width > max_width:
                ratio = max_width / img.width
                new_height = int(img.height * ratio)
                img = img.resize((max_width, new_height), Image.LANCZOS)
            
            # 处理透明通道（PNG转JPG时）
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            
            # 保存
            img.save(output_path, 'JPEG' if output_path.suffix.lower() in ['.jpg', '.jpeg'] else 'PNG', 
                    quality=quality, optimize=True)
            
            return True
    except Exception as e:
        print(f"处理失败 {input_path}: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description='图片批量压缩工具 - 龙虾工坊')
    parser.add_argument('input_dir', help='输入图片目录')
    parser.add_argument('output_dir', nargs='?', help='输出目录（默认在输入目录下创建compressed子目录）')
    parser.add_argument('--width', type=int, default=1920, help='最大宽度（默认1920）')
    parser.add_argument('--quality', type=int, default=85, help='压缩质量1-100（默认85）')
    
    args = parser.parse_args()
    
    input_dir = Path(args.input_dir)
    if not input_dir.exists():
        print(f"错误：目录不存在 {input_dir}")
        sys.exit(1)
    
    output_dir = Path(args.output_dir) if args.output_dir else input_dir / 'compressed'
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 支持的图片格式
    extensions = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'}
    
    # 统计
    total = 0
    success = 0
    total_saved = 0
    
    print(f"🦞 龙虾工坊 - 图片压缩工具")
    print(f"输入目录: {input_dir}")
    print(f"输出目录: {output_dir}")
    print(f"最大宽度: {args.width}px")
    print(f"压缩质量: {args.quality}%")
    print("-" * 50)
    
    for file in input_dir.iterdir():
        if file.suffix.lower() in extensions:
            total += 1
            output_path = output_dir / file.name
            
            # 获取原始大小
            original_size = file.stat().st_size
            
            if compress_image(file, output_path, args.width, args.quality):
                # 获取压缩后大小
                compressed_size = output_path.stat().st_size
                saved = original_size - compressed_size
                saved_pct = (saved / original_size) * 100 if original_size > 0 else 0
                
                success += 1
                total_saved += saved
                
                print(f"✓ {file.name}: {original_size/1024:.1f}KB → {compressed_size/1024:.1f}KB (节省 {saved_pct:.1f}%)")
    
    print("-" * 50)
    print(f"完成！处理 {success}/{total} 张图片")
    print(f"总共节省: {total_saved/1024/1024:.2f}MB")
    print(f"输出目录: {output_dir}")


if __name__ == '__main__':
    main()