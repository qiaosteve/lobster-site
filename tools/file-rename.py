#!/usr/bin/env python3
"""
文件批量重命名工具
龙虾工坊免费工具

功能：
- 序号重命名：file1.txt, file2.txt...
- 日期前缀：2026-03-21_file.txt
- 查找替换：替换文件名中的文字
- 大小写转换

使用方法：
python file-rename.py <目录> <模式> [选项]

模式：
  --seq          序号重命名（file_001.txt, file_002.txt...）
  --date         添加日期前缀（2026-03-21_filename.txt）
  --replace      查找替换（需要 --find 和 --replace-with 参数）
  --lower        转小写
  --upper        转大写
  --preview      预览模式（不实际执行）

示例：
python file-rename.py ./photos --seq --prefix photo_
python file-rename.py ./docs --replace --find "草稿" --replace-with "正式版"
python file-rename.py ./files --date
python file-rename.py ./images --lower --preview
"""

import os
import sys
import argparse
import re
from pathlib import Path
from datetime import datetime


def preview_rename(files, new_names, preview=True):
    """预览或执行重命名"""
    print("\n重命名预览：")
    print("-" * 60)
    
    for old, new in zip(files, new_names):
        if old.name != new:
            print(f"{old.name}")
            print(f"  → {new}")
    
    print("-" * 60)
    print(f"共 {len([1 for o, n in zip(files, new_names) if o.name != n])} 个文件需要重命名")
    
    if preview:
        response = input("\n确认执行？(y/N): ")
        return response.lower() == 'y'
    return True


def do_rename(files, new_names):
    """执行重命名"""
    success = 0
    for old, new in zip(files, new_names):
        if old.name != new:
            try:
                new_path = old.parent / new
                old.rename(new_path)
                success += 1
            except Exception as e:
                print(f"✗ 失败: {old.name} - {e}")
    return success


def main():
    parser = argparse.ArgumentParser(description='文件批量重命名工具 - 龙虾工坊')
    parser.add_argument('directory', help='要处理的目录')
    
    # 重命名模式
    mode_group = parser.add_mutually_exclusive_group(required=True)
    mode_group.add_argument('--seq', action='store_true', help='序号重命名')
    mode_group.add_argument('--date', action='store_true', help='添加日期前缀')
    mode_group.add_argument('--replace', action='store_true', help='查找替换')
    mode_group.add_argument('--lower', action='store_true', help='转小写')
    mode_group.add_argument('--upper', action='store_true', help='转大写')
    
    # 附加参数
    parser.add_argument('--prefix', default='file_', help='序号模式前缀（默认file_）')
    parser.add_argument('--start', type=int, default=1, help='序号起始值（默认1）')
    parser.add_argument('--find', help='要查找的文本')
    parser.add_argument('--replace-with', default='', help='替换为的文本')
    parser.add_argument('--preview', action='store_true', help='仅预览，不执行')
    parser.add_argument('--yes', '-y', action='store_true', help='跳过确认')
    
    args = parser.parse_args()
    
    directory = Path(args.directory)
    if not directory.is_dir():
        print(f"错误：{directory} 不是有效目录")
        sys.exit(1)
    
    # 获取所有文件
    files = sorted([f for f in directory.iterdir() if f.is_file()])
    
    if not files:
        print("目录中没有文件")
        sys.exit(0)
    
    today = datetime.now().strftime('%Y-%m-%d')
    new_names = []
    
    for i, file in enumerate(files):
        name = file.stem
        ext = file.suffix
        
        if args.seq:
            # 序号模式
            new_name = f"{args.prefix}{args.start + i:03d}{ext}"
        elif args.date:
            # 日期前缀
            new_name = f"{today}_{name}{ext}"
        elif args.replace:
            # 查找替换
            if not args.find:
                print("错误：--replace 模式需要 --find 参数")
                sys.exit(1)
            new_name = name.replace(args.find, args.replace_with) + ext
        elif args.lower:
            # 转小写
            new_name = name.lower() + ext.lower()
        elif args.upper:
            # 转大写
            new_name = name.upper() + ext.upper()
        
        new_names.append(new_name)
    
    print(f"🦞 龙虾工坊 - 文件重命名工具")
    print(f"目录: {directory}")
    print(f"模式: {', '.join([k for k, v in vars(args).items() if v and k in ['seq', 'date', 'replace', 'lower', 'upper']])}")
    
    # 预览或执行
    if args.preview:
        preview_rename(files, new_names, preview=False)
        print("\n预览模式，未执行重命名")
    else:
        if preview_rename(files, new_names, preview=not args.yes):
            success = do_rename(files, new_names)
            print(f"\n✓ 完成！成功重命名 {success} 个文件")


if __name__ == '__main__':
    main()