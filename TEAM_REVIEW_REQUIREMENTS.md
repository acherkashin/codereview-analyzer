# Team Review Feature Requirements

## Overview

The Team Review feature helps managers and team leads understand how a group of developers collaborates through pull request reviews. It gives a visual view of who reviews whose work, how much review activity happens between team members, and where collaboration extends outside the selected team.

This feature is intended to support team health reviews, review process retrospectives, staffing decisions, and coaching conversations about collaboration patterns.

## Problem Statement

Managers often need to understand how a team functions as a review network, not only how one person performs. Without a focused team view, it is difficult to see whether review work is balanced, whether knowledge is concentrated around a few people, and whether selected team members mostly review each other or spend significant effort reviewing people outside the team.

Existing review data is often spread across individual pull requests and broad charts. That makes it hard to quickly answer practical questions like who reviews whom, how many pull requests were reviewed, how many discussions were started, and how much authored work the selected team produced in a period.

## Goals

- Help a manager quickly understand review relationships inside a selected team
- Show review activity from selected team members to other pull request authors
- Make review direction clear, including relationships with people outside the selected team
- Show authored pull requests and pull request size distribution for the selected team
- Surface whether review work is balanced across team members
- Make it easy to move from visual summaries to supporting pull request examples

## Primary Users

- Engineering managers reviewing team collaboration patterns
- Team leads improving code review coverage and review quality
- Staff engineers or technical leads looking for knowledge-sharing and bottleneck signals
- Teams running retrospectives about pull request size, review load, and discussion patterns

## Core User Needs

- Select several team members to review together
- Choose a date range for the team review
- See a visual graph of reviewer-to-author relationships
- Understand how many pull requests were reviewed on each relationship
- See how many approvals, discussions, and comments happened between people
- Distinguish selected team members from outside contributors
- See authored pull requests created by selected team members
- Understand how many compact, medium, large, and very large pull requests the selected team created
- Compare how much each selected team member contributes to approvals and started discussions
- Hide outside contributors when the manager wants to focus only on review activity inside the selected team

## Feature Description

The Team Review feature provides a focused view of a selected group of team members within a chosen time period. It should help a manager understand how review activity flows from selected team members to pull request authors.

The feature should show:

- selected team members as the primary group being reviewed
- outside people when selected team members reviewed their pull requests
- directional review relationships from reviewer to pull request author
- review metrics on each relationship
- authored pull requests created by selected team members
- pull request size distribution for the selected team
- approval and discussion distribution across selected team members

When selected team members review someone outside the selected group, that outside person should appear so the manager can see where team review effort went. However, the feature should only show the selected team member’s activity toward that outside person. It should not show the outside person’s review activity back toward the selected team unless that person is also selected as part of the team.

The feature should also allow the manager to hide outside contributors from the Team Review view. Outside contributors should be shown by default. When outside contributors are hidden, the graph, relationship details, summary metrics, and approval/discussion distribution should include only relationships where both the reviewer and pull request author are selected team members. Authored pull requests created by selected team members should remain visible.

## Functional Requirements

- The feature must allow a manager to select multiple team members.
- The feature must allow a manager to focus on a selected time period.
- The feature must show a visual graph of review relationships between people.
- The graph must make relationship direction clear from reviewer to pull request author.
- The graph must show selected team members distinctly from outside contributors.
- The feature must show outside contributors only when selected team members reviewed their pull requests.
- The feature must allow outside contributors to be hidden from the Team Review view.
- When outside contributors are hidden, relationship-derived metrics must exclude selected-team review activity on outside contributors’ pull requests.
- The feature must avoid showing outside contributor review activity back toward selected team members unless the outside contributor is selected.
- Each relationship must show how many pull requests were reviewed in the selected period.
- Each relationship must provide supporting metrics for approvals, discussions started, and comments left.
- The feature must show authored pull requests created by selected team members in the selected period.
- The feature must summarize authored pull request sizes using compact, medium, large, and very large categories.
- The feature must show how approvals are distributed across selected team members.
- The feature must show how started discussions are distributed across selected team members.
- The feature must help the user move from summary information to specific pull requests and examples.

## Non-Functional Expectations

- The feature should be easy to scan during a team review or retrospective.
- The relationship graph should be readable for small and medium-sized teams.
- The feature should use clear, non-technical language for summary labels.
- The feature should present metrics consistently across graph, summary, and pull request sections.
- The feature should make directional relationships understandable without requiring manual interpretation.
- The feature should feel focused on team collaboration rather than overloaded with every available metric.
- The feature should support quick navigation from high-level collaboration patterns to concrete pull request examples.

## Out of Scope

- Detailed technical explanations of graph rendering or layout
- Internal system behavior, data processing logic, or implementation choices
- Measuring review quality beyond captured pull request activity
- Automatically judging whether a team’s review process is good or bad
- Long-term roadmap ideas unrelated to the first version of the Team Review experience

## Success Criteria

The first version of the feature is successful if a manager can:

- select several team members and understand their review network for a chosen period
- see who reviewed whose pull requests and how much activity happened on each relationship
- identify review bottlenecks, concentration, or gaps without reading every pull request
- see when selected team members spend review effort outside the selected group
- review the selected team’s authored pull requests and size distribution
- compare approval and discussion-start activity across selected team members
- move from a graph relationship or summary metric to concrete pull request examples

The document is successful if it can be read and understood by a non-engineering stakeholder without requiring code, technical background, or knowledge of internal system design.
