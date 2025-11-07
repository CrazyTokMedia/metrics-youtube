"""
Generate static visualization images from YouTube metrics comparison data.
Creates PNG files that can be pasted into spreadsheets or presentations.
"""

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from pathlib import Path

# Set style for professional-looking charts
sns.set_style("whitegrid")
plt.rcParams['figure.facecolor'] = 'white'
plt.rcParams['font.size'] = 10

def load_data(csv_path):
    """Load and parse the CSV data."""
    # Read CSV, skipping the description rows
    df = pd.read_csv(csv_path)

    # Clean up: remove empty rows and separate sections
    df = df.dropna(how='all')

    return df

def parse_csv_sections(csv_path):
    """Parse the CSV into separate dataframes for each section."""
    with open(csv_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    sections = {
        'longform_equal': [],
        'longform_lifetime': [],
        'shorts_equal': [],
        'shorts_lifetime': []
    }

    current_section = None
    header_row = None

    for i, line in enumerate(lines):
        if 'Long Form Videos - Equal Duration' in line:
            current_section = 'longform_equal'
            header_row = None
        elif 'Long Form Videos - Lifetime' in line:
            current_section = 'longform_lifetime'
            header_row = None
        elif 'Shorts - Equal Duration' in line:
            current_section = 'shorts_equal'
            header_row = None
        elif 'Shorts - Lifetime' in line:
            current_section = 'shorts_lifetime'
            header_row = None
        elif current_section and 'Video Title' in line:
            header_row = line
            sections[current_section].append(line)
        elif current_section and header_row and line.strip() and not line.startswith(',,,'):
            sections[current_section].append(line)

    # Convert to dataframes
    dfs = {}
    for section, data in sections.items():
        if data:
            from io import StringIO
            df = pd.read_csv(StringIO(''.join(data)))

            # Clean numeric columns - remove commas and convert to numeric
            numeric_cols = ['Equal Before Impressions', 'Equal After Impressions',
                          'Equal Before Views', 'Equal After Views',
                          'Lifetime Before Impressions', 'Lifetime After Impressions',
                          'Lifetime Before Views', 'Lifetime After Views']

            for col in numeric_cols:
                if col in df.columns:
                    df[col] = df[col].astype(str).str.replace(',', '').replace('nan', '0')
                    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

            dfs[section] = df

    return dfs

def create_summary_stats(dfs):
    """Create a summary statistics visualization."""
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle('YouTube Treatment Analysis - Summary Statistics', fontsize=16, fontweight='bold')

    # Long Form Equal Duration Summary
    df = dfs['longform_equal']
    ax = axes[0, 0]

    metrics = {
        'CTR Improved': (df['Equal After CTR'].str.rstrip('%').astype(float) >
                         df['Equal Before CTR'].str.rstrip('%').astype(float)).sum(),
        'Views Improved': (df['Equal After Views'] > df['Equal Before Views']).sum(),
        'Retention Improved': (df['Equal After Retention'].str.rstrip('%').astype(float) >
                              df['Equal Before Retention'].str.rstrip('%').astype(float)).sum()
    }

    total_videos = len(df)
    colors = ['#10b981' if v > total_videos/2 else '#ef4444' for v in metrics.values()]

    bars = ax.bar(metrics.keys(), metrics.values(), color=colors, alpha=0.7)
    ax.axhline(y=total_videos/2, color='gray', linestyle='--', label='50% threshold')
    ax.set_ylim(0, total_videos)
    ax.set_ylabel('Number of Videos')
    ax.set_title('Long Form - Equal Duration\nVideos Showing Improvement', fontweight='bold')
    ax.legend()

    # Add value labels on bars
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
                f'{int(height)}/{total_videos}',
                ha='center', va='bottom', fontweight='bold')

    # Shorts Equal Duration Summary
    df = dfs['shorts_equal']
    ax = axes[0, 1]

    metrics = {
        'CTR Improved': (df['Equal After CTR'].str.rstrip('%').astype(float) >
                         df['Equal Before CTR'].str.rstrip('%').astype(float)).sum(),
        'Views Improved': (df['Equal After Views'] > df['Equal Before Views']).sum()
    }

    total_videos = len(df)
    colors = ['#10b981' if v > total_videos/2 else '#ef4444' for v in metrics.values()]

    bars = ax.bar(metrics.keys(), metrics.values(), color=colors, alpha=0.7)
    ax.axhline(y=total_videos/2, color='gray', linestyle='--', label='50% threshold')
    ax.set_ylim(0, total_videos)
    ax.set_ylabel('Number of Videos')
    ax.set_title('Shorts - Equal Duration\nVideos Showing Improvement', fontweight='bold')
    ax.legend()

    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
                f'{int(height)}/{total_videos}',
                ha='center', va='bottom', fontweight='bold')

    # Average CTR Change - Long Form
    df = dfs['longform_equal']
    ax = axes[1, 0]

    df['CTR_Change'] = (df['Equal After CTR'].str.rstrip('%').astype(float) -
                        df['Equal Before CTR'].str.rstrip('%').astype(float))

    avg_change = df['CTR_Change'].mean()
    color = '#10b981' if avg_change > 0 else '#ef4444'

    ax.bar(['Average CTR Change'], [avg_change], color=color, alpha=0.7, width=0.4)
    ax.axhline(y=0, color='black', linewidth=0.8)
    ax.set_ylabel('Percentage Points')
    ax.set_title('Long Form - Average CTR Change\n(Equal Duration)', fontweight='bold')
    ax.text(0, avg_change, f'{avg_change:.2f}%', ha='center',
            va='bottom' if avg_change > 0 else 'top', fontweight='bold', fontsize=14)

    # Average CTR Change - Shorts
    df = dfs['shorts_equal']
    ax = axes[1, 1]

    df['CTR_Change'] = (df['Equal After CTR'].str.rstrip('%').astype(float) -
                        df['Equal Before CTR'].str.rstrip('%').astype(float))

    avg_change = df['CTR_Change'].mean()
    color = '#10b981' if avg_change > 0 else '#ef4444'

    ax.bar(['Average CTR Change'], [avg_change], color=color, alpha=0.7, width=0.4)
    ax.axhline(y=0, color='black', linewidth=0.8)
    ax.set_ylabel('Percentage Points')
    ax.set_title('Shorts - Average CTR Change\n(Equal Duration)', fontweight='bold')
    ax.text(0, avg_change, f'{avg_change:.2f}%', ha='center',
            va='bottom' if avg_change > 0 else 'top', fontweight='bold', fontsize=14)

    plt.tight_layout()
    return fig

def create_top_performers(dfs):
    """Create a chart showing top and bottom performers by CTR change."""
    fig, axes = plt.subplots(1, 2, figsize=(16, 8))
    fig.suptitle('Top & Bottom Performers by CTR Change (Equal Duration)',
                 fontsize=16, fontweight='bold')

    # Long Form
    df = dfs['longform_equal'].copy()
    df['CTR_Change'] = (df['Equal After CTR'].str.rstrip('%').astype(float) -
                        df['Equal Before CTR'].str.rstrip('%').astype(float))
    df = df.sort_values('CTR_Change')

    # Get top 5 and bottom 5
    bottom_5 = df.head(5)
    top_5 = df.tail(5)
    combined = pd.concat([bottom_5, top_5])

    ax = axes[0]
    colors = ['#ef4444' if x < 0 else '#10b981' for x in combined['CTR_Change']]

    y_pos = np.arange(len(combined))
    ax.barh(y_pos, combined['CTR_Change'], color=colors, alpha=0.7)
    ax.set_yticks(y_pos)
    ax.set_yticklabels([title[:40] + '...' if len(title) > 40 else title
                        for title in combined['Video Title']], fontsize=9)
    ax.set_xlabel('CTR Change (Percentage Points)')
    ax.set_title('Long Form Videos', fontweight='bold')
    ax.axvline(x=0, color='black', linewidth=0.8)

    # Add value labels
    for i, v in enumerate(combined['CTR_Change']):
        ax.text(v, i, f' {v:.1f}%', va='center',
                ha='left' if v > 0 else 'right', fontweight='bold')

    # Shorts
    df = dfs['shorts_equal'].copy()
    df['CTR_Change'] = (df['Equal After CTR'].str.rstrip('%').astype(float) -
                        df['Equal Before CTR'].str.rstrip('%').astype(float))
    df = df.sort_values('CTR_Change')

    bottom_5 = df.head(5)
    top_5 = df.tail(5)
    combined = pd.concat([bottom_5, top_5])

    ax = axes[1]
    colors = ['#ef4444' if x < 0 else '#10b981' for x in combined['CTR_Change']]

    y_pos = np.arange(len(combined))
    ax.barh(y_pos, combined['CTR_Change'], color=colors, alpha=0.7)
    ax.set_yticks(y_pos)
    ax.set_yticklabels([title[:40] + '...' if len(title) > 40 else title
                        for title in combined['Video Title']], fontsize=9)
    ax.set_xlabel('CTR Change (Percentage Points)')
    ax.set_title('Shorts', fontweight='bold')
    ax.axvline(x=0, color='black', linewidth=0.8)

    for i, v in enumerate(combined['CTR_Change']):
        ax.text(v, i, f' {v:.1f}%', va='center',
                ha='left' if v > 0 else 'right', fontweight='bold')

    plt.tight_layout()
    return fig

def create_metrics_comparison(dfs):
    """Create before/after comparison for multiple metrics."""
    fig, axes = plt.subplots(2, 3, figsize=(18, 10))
    fig.suptitle('Long Form Videos - Before vs After Comparison (Equal Duration)',
                 fontsize=16, fontweight='bold')

    df = dfs['longform_equal'].copy()

    # CTR
    ax = axes[0, 0]
    before = df['Equal Before CTR'].str.rstrip('%').astype(float)
    after = df['Equal After CTR'].str.rstrip('%').astype(float)

    x = np.arange(len(df))
    width = 0.35

    ax.bar(x - width/2, before, width, label='Before', color='#94a3b8', alpha=0.7)
    ax.bar(x + width/2, after, width, label='After', color='#667eea', alpha=0.7)
    ax.set_ylabel('CTR (%)')
    ax.set_title('Click-Through Rate', fontweight='bold')
    ax.legend()
    ax.set_xticks([])

    # Views
    ax = axes[0, 1]
    before = df['Equal Before Views']
    after = df['Equal After Views']

    ax.bar(x - width/2, before, width, label='Before', color='#94a3b8', alpha=0.7)
    ax.bar(x + width/2, after, width, label='After', color='#667eea', alpha=0.7)
    ax.set_ylabel('Views')
    ax.set_title('Views', fontweight='bold')
    ax.legend()
    ax.set_xticks([])

    # Impressions
    ax = axes[0, 2]
    before = df['Equal Before Impressions'].astype(float)
    after = df['Equal After Impressions'].astype(float)

    ax.bar(x - width/2, before, width, label='Before', color='#94a3b8', alpha=0.7)
    ax.bar(x + width/2, after, width, label='After', color='#667eea', alpha=0.7)
    ax.set_ylabel('Impressions')
    ax.set_title('Impressions', fontweight='bold')
    ax.legend()
    ax.set_xticks([])

    # Distribution of CTR Changes
    ax = axes[1, 0]
    ctr_change = (df['Equal After CTR'].str.rstrip('%').astype(float) -
                  df['Equal Before CTR'].str.rstrip('%').astype(float))

    colors = ['#10b981' if x > 0 else '#ef4444' for x in ctr_change]
    ax.bar(x, ctr_change, color=colors, alpha=0.7)
    ax.axhline(y=0, color='black', linewidth=0.8)
    ax.set_ylabel('CTR Change (pp)')
    ax.set_title('CTR Change Distribution', fontweight='bold')
    ax.set_xticks([])

    # Distribution of View Changes
    ax = axes[1, 1]
    view_change = df['Equal After Views'] - df['Equal Before Views']

    colors = ['#10b981' if x > 0 else '#ef4444' for x in view_change]
    ax.bar(x, view_change, color=colors, alpha=0.7)
    ax.axhline(y=0, color='black', linewidth=0.8)
    ax.set_ylabel('View Change')
    ax.set_title('View Change Distribution', fontweight='bold')
    ax.set_xticks([])

    # Retention comparison
    ax = axes[1, 2]
    # Filter out N/A values
    df_retention = df[df['Equal Before Retention'] != 'N/A'].copy()
    before = df_retention['Equal Before Retention'].str.rstrip('%').astype(float)
    after = df_retention['Equal After Retention'].str.rstrip('%').astype(float)

    x_ret = np.arange(len(df_retention))
    ax.bar(x_ret - width/2, before, width, label='Before', color='#94a3b8', alpha=0.7)
    ax.bar(x_ret + width/2, after, width, label='After', color='#667eea', alpha=0.7)
    ax.set_ylabel('Retention (%)')
    ax.set_title('Retention Rate', fontweight='bold')
    ax.legend()
    ax.set_xticks([])

    plt.tight_layout()
    return fig

def create_shorts_metrics_comparison(dfs):
    """Create before/after comparison for Shorts metrics."""
    fig, axes = plt.subplots(2, 3, figsize=(18, 10))
    fig.suptitle('Shorts - Before vs After Comparison (Equal Duration)',
                 fontsize=16, fontweight='bold')

    df = dfs['shorts_equal'].copy()

    # CTR
    ax = axes[0, 0]
    before = df['Equal Before CTR'].str.rstrip('%').astype(float)
    after = df['Equal After CTR'].str.rstrip('%').astype(float)

    x = np.arange(len(df))
    width = 0.35

    ax.bar(x - width/2, before, width, label='Before', color='#94a3b8', alpha=0.7)
    ax.bar(x + width/2, after, width, label='After', color='#f59e0b', alpha=0.7)
    ax.set_ylabel('CTR (%)')
    ax.set_title('Click-Through Rate', fontweight='bold')
    ax.legend()
    ax.set_xticks([])

    # Views
    ax = axes[0, 1]
    before = df['Equal Before Views']
    after = df['Equal After Views']

    ax.bar(x - width/2, before, width, label='Before', color='#94a3b8', alpha=0.7)
    ax.bar(x + width/2, after, width, label='After', color='#f59e0b', alpha=0.7)
    ax.set_ylabel('Views')
    ax.set_title('Views', fontweight='bold')
    ax.legend()
    ax.set_xticks([])

    # Impressions
    ax = axes[0, 2]
    before = df['Equal Before Impressions'].astype(float)
    after = df['Equal After Impressions'].astype(float)

    ax.bar(x - width/2, before, width, label='Before', color='#94a3b8', alpha=0.7)
    ax.bar(x + width/2, after, width, label='After', color='#f59e0b', alpha=0.7)
    ax.set_ylabel('Impressions')
    ax.set_title('Impressions', fontweight='bold')
    ax.legend()
    ax.set_xticks([])

    # Distribution of CTR Changes
    ax = axes[1, 0]
    ctr_change = (df['Equal After CTR'].str.rstrip('%').astype(float) -
                  df['Equal Before CTR'].str.rstrip('%').astype(float))

    colors = ['#10b981' if x > 0 else '#ef4444' for x in ctr_change]
    ax.bar(x, ctr_change, color=colors, alpha=0.7)
    ax.axhline(y=0, color='black', linewidth=0.8)
    ax.set_ylabel('CTR Change (pp)')
    ax.set_title('CTR Change Distribution', fontweight='bold')
    ax.set_xticks([])

    # Distribution of View Changes
    ax = axes[1, 1]
    view_change = df['Equal After Views'] - df['Equal Before Views']

    colors = ['#10b981' if x > 0 else '#ef4444' for x in view_change]
    ax.bar(x, view_change, color=colors, alpha=0.7)
    ax.axhline(y=0, color='black', linewidth=0.8)
    ax.set_ylabel('View Change')
    ax.set_title('View Change Distribution', fontweight='bold')
    ax.set_xticks([])

    # Impressions change
    ax = axes[1, 2]
    impression_change = df['Equal After Impressions'].astype(float) - df['Equal Before Impressions'].astype(float)

    colors = ['#10b981' if x > 0 else '#ef4444' for x in impression_change]
    ax.bar(x, impression_change, color=colors, alpha=0.7)
    ax.axhline(y=0, color='black', linewidth=0.8)
    ax.set_ylabel('Impression Change')
    ax.set_title('Impression Change Distribution', fontweight='bold')
    ax.set_xticks([])

    plt.tight_layout()
    return fig

def create_lifetime_comparison(dfs):
    """Create lifetime duration comparison charts."""
    fig, axes = plt.subplots(2, 2, figsize=(16, 10))
    fig.suptitle('Lifetime Duration Analysis - Overall Performance Trends',
                 fontsize=16, fontweight='bold')

    # Long Form CTR
    df = dfs['longform_lifetime'].copy()
    ax = axes[0, 0]

    df['CTR_Change'] = (df['Lifetime After CTR'].str.rstrip('%').astype(float) -
                        df['Lifetime Before CTR'].str.rstrip('%').astype(float))

    colors = ['#10b981' if x > 0 else '#ef4444' for x in df['CTR_Change']]
    y_pos = np.arange(len(df))

    ax.barh(y_pos, df['CTR_Change'], color=colors, alpha=0.7)
    ax.set_yticks(y_pos)
    ax.set_yticklabels([title[:25] + '...' if len(title) > 25 else title
                        for title in df['Video Title']], fontsize=8)
    ax.set_xlabel('CTR Change (pp)')
    ax.set_title('Long Form - CTR Change (Lifetime)', fontweight='bold')
    ax.axvline(x=0, color='black', linewidth=0.8)

    # Long Form Views
    ax = axes[0, 1]
    df['View_Change'] = df['Lifetime After Views'] - df['Lifetime Before Views']

    colors = ['#10b981' if x > 0 else '#ef4444' for x in df['View_Change']]
    ax.barh(y_pos, df['View_Change'], color=colors, alpha=0.7)
    ax.set_yticks(y_pos)
    ax.set_yticklabels([title[:25] + '...' if len(title) > 25 else title
                        for title in df['Video Title']], fontsize=8)
    ax.set_xlabel('View Change')
    ax.set_title('Long Form - View Change (Lifetime)', fontweight='bold')
    ax.axvline(x=0, color='black', linewidth=0.8)

    # Shorts CTR
    df = dfs['shorts_lifetime'].copy()
    ax = axes[1, 0]

    df['CTR_Change'] = (df['Lifetime After CTR'].str.rstrip('%').astype(float) -
                        df['Lifetime Before CTR'].str.rstrip('%').astype(float))

    # Get top 10 and bottom 10
    df_sorted = df.sort_values('CTR_Change')
    df_display = pd.concat([df_sorted.head(10), df_sorted.tail(10)])

    colors = ['#10b981' if x > 0 else '#ef4444' for x in df_display['CTR_Change']]
    y_pos = np.arange(len(df_display))

    ax.barh(y_pos, df_display['CTR_Change'], color=colors, alpha=0.7)
    ax.set_yticks(y_pos)
    ax.set_yticklabels([title[:25] + '...' if len(title) > 25 else title
                        for title in df_display['Video Title']], fontsize=7)
    ax.set_xlabel('CTR Change (pp)')
    ax.set_title('Shorts - CTR Change (Lifetime, Top/Bottom 10)', fontweight='bold')
    ax.axvline(x=0, color='black', linewidth=0.8)

    # Shorts Views
    ax = axes[1, 1]
    df['View_Change'] = df['Lifetime After Views'] - df['Lifetime Before Views']
    df_sorted = df.sort_values('View_Change')
    df_display = pd.concat([df_sorted.head(10), df_sorted.tail(10)])

    colors = ['#10b981' if x > 0 else '#ef4444' for x in df_display['View_Change']]
    y_pos = np.arange(len(df_display))

    ax.barh(y_pos, df_display['View_Change'], color=colors, alpha=0.7)
    ax.set_yticks(y_pos)
    ax.set_yticklabels([title[:25] + '...' if len(title) > 25 else title
                        for title in df_display['Video Title']], fontsize=7)
    ax.set_xlabel('View Change')
    ax.set_title('Shorts - View Change (Lifetime, Top/Bottom 10)', fontweight='bold')
    ax.axvline(x=0, color='black', linewidth=0.8)

    plt.tight_layout()
    return fig

def create_ctr_scatter(dfs):
    """Create scatter plot showing before vs after CTR."""
    fig, axes = plt.subplots(1, 2, figsize=(16, 7))
    fig.suptitle('CTR: Before vs After (Equal Duration) - Scatter Analysis',
                 fontsize=16, fontweight='bold')

    # Long Form
    df = dfs['longform_equal'].copy()
    ax = axes[0]

    before = df['Equal Before CTR'].str.rstrip('%').astype(float)
    after = df['Equal After CTR'].str.rstrip('%').astype(float)

    colors = ['#10b981' if a > b else '#ef4444' for b, a in zip(before, after)]

    ax.scatter(before, after, s=150, alpha=0.6, c=colors, edgecolors='black', linewidth=1.5)

    # Add diagonal line (no change line)
    max_val = max(before.max(), after.max())
    ax.plot([0, max_val], [0, max_val], 'k--', alpha=0.3, label='No change line')

    ax.set_xlabel('Before CTR (%)', fontsize=12)
    ax.set_ylabel('After CTR (%)', fontsize=12)
    ax.set_title('Long Form Videos', fontweight='bold')
    ax.legend()
    ax.grid(alpha=0.3)

    # Add text annotation
    improved = (after > before).sum()
    ax.text(0.05, 0.95, f'Improved: {improved}/{len(df)}',
            transform=ax.transAxes, fontsize=11, verticalalignment='top',
            bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))

    # Shorts
    df = dfs['shorts_equal'].copy()
    ax = axes[1]

    before = df['Equal Before CTR'].str.rstrip('%').astype(float)
    after = df['Equal After CTR'].str.rstrip('%').astype(float)

    colors = ['#10b981' if a > b else '#ef4444' for b, a in zip(before, after)]

    ax.scatter(before, after, s=150, alpha=0.6, c=colors, edgecolors='black', linewidth=1.5)

    max_val = max(before.max(), after.max())
    ax.plot([0, max_val], [0, max_val], 'k--', alpha=0.3, label='No change line')

    ax.set_xlabel('Before CTR (%)', fontsize=12)
    ax.set_ylabel('After CTR (%)', fontsize=12)
    ax.set_title('Shorts', fontweight='bold')
    ax.legend()
    ax.grid(alpha=0.3)

    improved = (after > before).sum()
    ax.text(0.05, 0.95, f'Improved: {improved}/{len(df)}',
            transform=ax.transAxes, fontsize=11, verticalalignment='top',
            bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))

    plt.tight_layout()
    return fig

def create_heatmap(dfs):
    """Create heatmap showing all videos and their metric changes."""
    fig, axes = plt.subplots(1, 2, figsize=(18, 12))
    fig.suptitle('Performance Heatmap - All Metrics Change (Equal Duration)',
                 fontsize=16, fontweight='bold')

    # Long Form
    df = dfs['longform_equal'].copy()
    ax = axes[0]

    # Calculate changes
    changes = pd.DataFrame({
        'CTR': (df['Equal After CTR'].str.rstrip('%').astype(float) -
                df['Equal Before CTR'].str.rstrip('%').astype(float)),
        'Views': ((df['Equal After Views'] - df['Equal Before Views']) /
                  df['Equal Before Views'].replace(0, 1) * 100),
        'Impressions': ((df['Equal After Impressions'].astype(float) -
                        df['Equal Before Impressions'].astype(float)) /
                       df['Equal Before Impressions'].astype(float).replace(0, 1) * 100)
    }, index=[title[:30] + '...' if len(title) > 30 else title
              for title in df['Video Title']])

    sns.heatmap(changes, annot=True, fmt='.1f', cmap='RdYlGn', center=0,
                cbar_kws={'label': 'Change (%)'}, ax=ax, linewidths=0.5)
    ax.set_title('Long Form Videos', fontweight='bold')
    ax.set_xlabel('Metrics')
    ax.set_ylabel('')

    # Shorts (show top 15)
    df = dfs['shorts_equal'].copy()
    ax = axes[1]

    # Calculate changes
    df['CTR_Change'] = (df['Equal After CTR'].str.rstrip('%').astype(float) -
                        df['Equal Before CTR'].str.rstrip('%').astype(float))

    # Sort by CTR change and take top 8 and bottom 7
    df_sorted = df.sort_values('CTR_Change')
    df_display = pd.concat([df_sorted.head(7), df_sorted.tail(8)])

    changes = pd.DataFrame({
        'CTR': (df_display['Equal After CTR'].str.rstrip('%').astype(float) -
                df_display['Equal Before CTR'].str.rstrip('%').astype(float)),
        'Views': ((df_display['Equal After Views'] - df_display['Equal Before Views']) /
                  df_display['Equal Before Views'].replace(0, 1) * 100),
        'Impressions': ((df_display['Equal After Impressions'].astype(float) -
                        df_display['Equal Before Impressions'].astype(float)) /
                       df_display['Equal Before Impressions'].astype(float).replace(0, 1) * 100)
    }, index=[title[:30] + '...' if len(title) > 30 else title
              for title in df_display['Video Title']])

    sns.heatmap(changes, annot=True, fmt='.1f', cmap='RdYlGn', center=0,
                cbar_kws={'label': 'Change (%)'}, ax=ax, linewidths=0.5)
    ax.set_title('Shorts (Top/Bottom by CTR)', fontweight='bold')
    ax.set_xlabel('Metrics')
    ax.set_ylabel('')

    plt.tight_layout()
    return fig

def main():
    """Main function to generate all visualizations."""
    print("YouTube Metrics Visualization Generator")
    print("=" * 50)

    # Find the CSV file
    csv_file = "JSTB spreadsheet (Extension) - YouTube Metrics Comparison.csv"

    if not Path(csv_file).exists():
        print(f"ERROR: Could not find {csv_file}")
        print("Please make sure the CSV file is in the same directory as this script.")
        return

    print(f"\nLoading data from: {csv_file}")

    try:
        dfs = parse_csv_sections(csv_file)
        print(f"✓ Successfully loaded data")
        print(f"  - Long Form Equal: {len(dfs['longform_equal'])} videos")
        print(f"  - Long Form Lifetime: {len(dfs['longform_lifetime'])} videos")
        print(f"  - Shorts Equal: {len(dfs['shorts_equal'])} videos")
        print(f"  - Shorts Lifetime: {len(dfs['shorts_lifetime'])} videos")

        # Create output directory
        output_dir = Path("visualizations")
        output_dir.mkdir(exist_ok=True)
        print(f"\n✓ Created output directory: {output_dir}")

        # Generate visualizations
        print("\nGenerating visualizations...")

        print("  1. Summary Statistics...")
        fig1 = create_summary_stats(dfs)
        fig1.savefig(output_dir / "1_summary_stats.png", dpi=300, bbox_inches='tight')
        plt.close(fig1)
        print("     ✓ Saved: 1_summary_stats.png")

        print("  2. Top & Bottom Performers...")
        fig2 = create_top_performers(dfs)
        fig2.savefig(output_dir / "2_top_performers.png", dpi=300, bbox_inches='tight')
        plt.close(fig2)
        print("     ✓ Saved: 2_top_performers.png")

        print("  3. Long Form - Metrics Comparison...")
        fig3 = create_metrics_comparison(dfs)
        fig3.savefig(output_dir / "3_longform_metrics_comparison.png", dpi=300, bbox_inches='tight')
        plt.close(fig3)
        print("     ✓ Saved: 3_longform_metrics_comparison.png")

        print("  4. Shorts - Metrics Comparison...")
        fig4 = create_shorts_metrics_comparison(dfs)
        fig4.savefig(output_dir / "4_shorts_metrics_comparison.png", dpi=300, bbox_inches='tight')
        plt.close(fig4)
        print("     ✓ Saved: 4_shorts_metrics_comparison.png")

        print("  5. Lifetime Duration Analysis...")
        fig5 = create_lifetime_comparison(dfs)
        fig5.savefig(output_dir / "5_lifetime_comparison.png", dpi=300, bbox_inches='tight')
        plt.close(fig5)
        print("     ✓ Saved: 5_lifetime_comparison.png")

        print("  6. CTR Scatter Analysis...")
        fig6 = create_ctr_scatter(dfs)
        fig6.savefig(output_dir / "6_ctr_scatter.png", dpi=300, bbox_inches='tight')
        plt.close(fig6)
        print("     ✓ Saved: 6_ctr_scatter.png")

        print("  7. Performance Heatmap...")
        fig7 = create_heatmap(dfs)
        fig7.savefig(output_dir / "7_performance_heatmap.png", dpi=300, bbox_inches='tight')
        plt.close(fig7)
        print("     ✓ Saved: 7_performance_heatmap.png")

        print("\n" + "=" * 50)
        print("✓ All visualizations generated successfully!")
        print(f"\nGenerated {7} visualization files:")
        print("  1. Summary Statistics (overview)")
        print("  2. Top & Bottom Performers (CTR)")
        print("  3. Long Form - Detailed Metrics")
        print("  4. Shorts - Detailed Metrics")
        print("  5. Lifetime Duration Analysis")
        print("  6. CTR Scatter Plot (correlation)")
        print("  7. Performance Heatmap (all metrics)")
        print(f"\nOutput files saved in: {output_dir.absolute()}")
        print("\nYou can now:")
        print("  1. Open the PNG files to view them")
        print("  2. Copy/paste them into your Google Sheet")
        print("  3. Use them in presentations")

    except Exception as e:
        print(f"\n✗ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
