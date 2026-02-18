# Hello-Agents 内容下载脚本
# 在 Windows PowerShell 中运行此脚本

Write-Host "=== 下载 Hello-Agents 课程内容 ===" -ForegroundColor Green

# 设置下载目录
$downloadDir = "C:\Users\Administrator\Desktop\公开课\openClasses\courses\Hello-Agents"
$tempDir = "$env:TEMP\hello-agents-temp"

# 检查 git 是否可用
try {
    $gitVersion = git --version
    Write-Host "✓ 找到 Git: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ 未找到 Git，请先安装 Git: https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}

# 克隆仓库
Write-Host "正在克隆仓库..." -ForegroundColor Yellow
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}

git clone https://github.com/datawhalechina/hello-agents.git $tempDir

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ 克隆成功！" -ForegroundColor Green

    # 定义章节映射（GitHub 上的文件路径 → 本地目录）
    $chapters = @{
        "docs/chapter2.md" = "part1-foundation\ch02-history\README.md"
        "docs/chapter3.md" = "part1-foundation\ch03-llm-basics\README.md"
        "docs/chapter5.md" = "part2-building-agents\ch05-lowcode\README.md"
        "docs/chapter6.md" = "part2-building-agents\ch06-frameworks\README.md"
        "docs/chapter7.md" = "part2-building-agents\ch07-custom-framework\README.md"
        "docs/chapter9.md" = "part3-advanced\ch09-context\README.md"
        "docs/chapter10.md" = "part3-advanced\ch10-protocols\README.md"
        "docs/chapter11.md" = "part3-advanced\ch11-training\README.md"
        "docs/chapter12.md" = "part3-advanced\ch12-evaluation\README.md"
        "docs/chapter13.md" = "part4-cases\ch13-travel-agent\README.md"
        "docs/chapter14.md" = "part4-cases\ch14-research-agent\README.md"
        "docs/chapter16.md" = "part5-graduation\ch16-project\README.md"
    }

    # 复制文件
    Write-Host "正在复制章节内容..." -ForegroundColor Yellow
    $successCount = 0
    $failCount = 0

    foreach ($source in $chapters.Keys) {
        $dest = $chapters[$source]
        $sourcePath = Join-Path $tempDir $source
        $destPath = Join-Path $downloadDir $dest

        if (Test-Path $sourcePath) {
            # 备份现有文件
            if (Test-Path $destPath) {
                $backupPath = "$destPath.backup"
                Copy-Item $destPath $backupPath -Force
            }

            Copy-Item $sourcePath $destPath -Force
            Write-Host "  ✓ 已复制: $source" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "  ✗ 文件不存在: $source" -ForegroundColor Red
            $failCount++
        }
    }

    Write-Host "`n=== 完成 ===" -ForegroundColor Green
    Write-Host "成功: $successCount 个文件" -ForegroundColor Green
    if ($failCount -gt 0) {
        Write-Host "失败: $failCount 个文件" -ForegroundColor Red
    }

    # 清理临时文件
    Write-Host "`n是否删除临时文件? (Y/N)" -ForegroundColor Yellow
    $confirm = Read-Host
    if ($confirm -eq 'Y' -or $confirm -eq 'y') {
        Remove-Item -Path $tempDir -Recurse -Force
        Write-Host "✓ 临时文件已删除" -ForegroundColor Green
    } else {
        Write-Host "临时文件位置: $tempDir" -ForegroundColor Cyan
    }
} else {
    Write-Host "✗ 克隆失败" -ForegroundColor Red
    Write-Host "请检查网络连接和代理设置" -ForegroundColor Yellow
    exit 1
}
