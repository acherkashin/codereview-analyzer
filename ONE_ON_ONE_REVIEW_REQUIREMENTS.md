# 1:1 Review Feature Requirements

## Overview

The 1:1 Review feature helps managers prepare for and run meaningful one-to-one conversations with team members by using pull request activity as the foundation for discussion. It gives a clear view of recent authored work, review participation, and collaboration patterns so the conversation can move quickly from general impressions to concrete examples.

This feature is intended to support productive coaching conversations, recognize strengths, identify improvement opportunities, and agree on practical next actions.

## Problem Statement

Managers often need to understand how a team member is contributing through pull requests, both as an author and as a reviewer. Without a focused view, it is difficult to quickly identify what has happened recently, what patterns are emerging, and what should be discussed in a 1:1.

Existing review data is often fragmented, time-consuming to interpret, and not organized around the specific needs of a manager preparing for a conversation with one person.

## Goals

- Help a manager quickly understand a team member’s recent pull request activity
- Show both authored work and review participation in one place
- Surface patterns that are useful for discussion in a 1:1
- Make it easy to move from summary insights to supporting examples
- Support clear, actionable follow-up after the conversation

## Primary Users

- Engineering managers preparing for 1:1 meetings
- Team leads coaching developers through review quality and collaboration habits
- Any reviewer responsible for helping a team member improve pull request quality and review behavior

## Core User Needs

- Quickly see what a team member has recently authored
- Quickly see how that person participates in reviewing the work of others
- Understand what comments and discussions that person has started
- Identify patterns worth discussing without reading every pull request in full
- Find concrete examples that support coaching, praise, or follow-up actions
- Leave the page with a small set of clear next steps for the conversation

## Feature Description

The 1:1 Review feature provides a focused view of one selected team member within a chosen time period. It should help a manager understand both sides of that person’s contribution:

- the pull requests they created
- the pull requests they reviewed
- the conversations they initiated during review

The feature should combine concise insights, supporting examples, and action-oriented observations in a way that is easy to scan and easy to discuss during a live meeting.

## Functional Requirements

- The feature must allow a manager to choose a specific team member to review.
- The feature must allow a manager to focus on a selected time period.
- The feature must show the team member’s authored pull requests for that period.
- The feature must show the pull requests where the team member participated as a reviewer.
- The feature must show the comments and discussions started by that team member in review activity.
- The feature must present a small set of insights that help start the conversation quickly.
- The feature must include short highlights that point to notable patterns or observations.
- The feature must help the user move from summary information to specific pull requests and examples.
- The feature must support identifying next steps or actions to discuss with the team member.
- The feature must make it easy to distinguish authored activity from review activity.
- The feature must keep the information focused on the selected person and the selected period.

## Non-Functional Expectations

- The feature should be easy to scan in a short amount of time.
- The feature should use clear and understandable language.
- The feature should present information consistently across different sections.
- The feature should help the user move quickly from high-level patterns to supporting examples.
- The feature should feel focused and purposeful rather than overloaded with information.
- The feature should support live meeting use, where the manager may need to navigate quickly during conversation.

## Out of Scope

- Detailed technical explanations of how the feature is built
- Internal system behavior, data processing logic, or implementation choices
- Broad product requirements unrelated to the 1:1 Review experience
- Long-term roadmap ideas that are not part of the intended first version

## Success Criteria

The first version of the feature is successful if a manager can:

- select a team member and quickly understand their recent pull request activity
- see both authored work and reviewer participation in one focused view
- identify specific comments or discussions that support a coaching conversation
- recognize patterns worth discussing without significant manual investigation
- leave the page with a clearer sense of what should be addressed in the 1:1

The document is successful if it can be read and understood by a non-engineering stakeholder without requiring code, technical background, or knowledge of internal system design.
