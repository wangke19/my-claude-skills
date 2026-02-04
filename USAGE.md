# Usage Guide for My Claude Skills

## Repository Information

- **GitLab URL**: https://gitlab.cee.redhat.com/kewang/my-claude-skills
- **Git Clone URL**: `git@gitlab.cee.redhat.com:kewang/my-claude-skills.git`
- **Local Path**: `~/work/gitlab/my-claude-skills`

## For You (Owner)

Your skill is already working locally! No additional setup needed because you have the skill in `~/.claude/skills/`.

### To Keep Both Locations in Sync

When you update the skill:

```bash
# After editing ~/.claude/skills/technical-presentation-generator/SKILL.md
cd ~/work/gitlab/my-claude-skills
cp -r ~/.claude/skills/technical-presentation-generator ./skills/
git add .
git commit -m "Update technical-presentation-generator skill"
git push
```

Or edit directly in the repo:

```bash
# Edit ~/work/gitlab/my-claude-skills/skills/technical-presentation-generator/SKILL.md
cd ~/work/gitlab/my-claude-skills
git add .
git commit -m "Update technical-presentation-generator skill"
git push

# Copy back to local skills
cp -r ./skills/technical-presentation-generator ~/.claude/skills/
```

## For Colleagues (Users)

### Option 1: Use From Git Repo (Recommended)

1. **Edit Claude Code config** (`~/.claude/config.json`):

```json
{
  "skillRepositories": [
    {
      "url": "git@gitlab.cee.redhat.com:kewang/my-claude-skills.git"
    }
  ]
}
```

2. **Restart Claude Code** (or it will auto-reload)

3. **Done!** Skills will be automatically available.

### Option 2: Manual Installation

```bash
# Clone the repository
git clone git@gitlab.cee.redhat.com:kewang/my-claude-skills.git ~/my-claude-skills

# Symlink the skill
ln -s ~/my-claude-skills/skills/technical-presentation-generator ~/.claude/skills/

# Or copy it
cp -r ~/my-claude-skills/skills/technical-presentation-generator ~/.claude/skills/
```

### Option 3: Browse and Use Online

Visit the GitLab repo to read the skill documentation without installing:
https://gitlab.cee.redhat.com/kewang/my-claude-skills

## Testing the Skill

After installation, test with:

```
Create a technical presentation about "Redis Caching Strategies" with:
- 12 slides
- Chinese/English bilingual
- Tech-focused theme
- Include code examples
```

Claude should:
1. Ask clarifying questions about visual theme, content ratio, etc.
2. Create a self-contained HTML file
3. Follow the patterns from the skill (bilingual, code highlighting, navigation)

## Troubleshooting

### Skill Not Loading

1. Check config file exists: `cat ~/.claude/config.json`
2. Verify repository URL is correct
3. Try manual installation (Option 2 above)
4. Restart Claude Code

### Updates Not Appearing

```bash
# Update from Git
cd ~/my-claude-skills  # or wherever you cloned it
git pull

# If using symlink, it updates automatically
# If you copied, re-copy:
cp -r ~/my-claude-skills/skills/technical-presentation-generator ~/.claude/skills/
```

## Adding More Skills

To add new skills to this repository:

1. Create skill directory:
```bash
cd ~/work/gitlab/my-claude-skills/skills
mkdir your-new-skill
```

2. Create `SKILL.md` following the template in `technical-presentation-generator/SKILL.md`

3. Test the skill following TDD approach (see writing-skills skill)

4. Commit and push:
```bash
git add .
git commit -m "Add your-new-skill"
git push
```

## Repository Maintenance

### Regular Updates

```bash
cd ~/work/gitlab/my-claude-skills

# Check status
git status

# Pull latest changes (if collaborating)
git pull

# Push your changes
git push
```

### Branch Strategy

Main branch (`main`) contains stable, tested skills.

For experimental skills:
```bash
git checkout -b experimental/new-feature
# ... make changes ...
git commit -m "Experiment with new feature"
git push -u origin experimental/new-feature
```

## Sharing

### Within Red Hat

Share the GitLab URL with colleagues:
```
git@gitlab.cee.redhat.com:kewang/my-claude-skills.git
```

They can add to their config as shown in "For Colleagues" section above.

### External Sharing

If you want to share outside Red Hat, you'd need to:
1. Create public GitHub/GitLab repo
2. Copy skills there
3. Share that URL instead

## Questions?

Contact: **Ke Wang** (kewang@redhat.com)
