import React from "react";
import { Database, Article } from "../database.types";

import {
  Session,
  createClientComponentClient,
} from "@supabase/auth-helpers-nextjs";

type Props = { article: Article; onUpdate: (updatedArticle: Article) => void };
const buttonSize = "18";

export default function ArticleRow({ article, onUpdate }: Props) {
  const supabase = createClientComponentClient<Database>();
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  const localDate = new Date(article.published_at).toLocaleString(
    "en-GB",
    options,
  );

  const SCORE_VALUES = [-10, -7, -4, 0, 4, 7, 10];

  const getNextScore = (
    currentScore: number,
    direction: "up" | "down",
  ): number => {
    // Find the next appropriate score
    if (direction === "up") {
      // Find the smallest score that's greater than current score
      return SCORE_VALUES.find(score => score > currentScore) ?? SCORE_VALUES[SCORE_VALUES.length - 1];
    } else {
      // Find the largest score that's smaller than current score
      return SCORE_VALUES.findLast(score => score < currentScore) ?? SCORE_VALUES[0];
    }
  };

  const updateArticleScore = async (direction: "up" | "down") => {
    const newScore = getNextScore(article.score, direction);

    const { error } = await supabase
      .from("article")
      .update({ score: newScore, agent: "USER" })
      .eq("id", article.id);

    if (error === null) {
      article.score = newScore;
      article.agent = "USER";
      onUpdate(article);
    }
  };

  const handleThumbsUp = () => updateArticleScore("up");
  const handleThumbsDown = () => updateArticleScore("down");

  const handleArticleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(article.link, "_blank", "noopener,noreferrer");
    if (!article.read) {
      const { error } = await supabase
        .from("article")
        .update({ read: true })
        .eq("id", article.id);

      if (error === null) {
        article.read = true;
        onUpdate(article);
      }
    }
  };

  const handleArchive = async () => {
    const { error } = await supabase
      .from("article")
      .update({ archived: !article.archived })
      .eq("id", article.id);
    if (error === null) {
      article.archived = !article.archived;
      onUpdate(article);
    }
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from("article")
      .update({ saved: !article.saved })
      .eq("id", article.id);
    if (error === null) {
      article.saved = !article.saved;
      onUpdate(article);
    }
  };

  const shortSummary =
    article.summary !== null && article.summary.length > 5000
      ? article.summary.slice(0, 5000) + "..."
      : article.summary;

  return (
    <div className={`article card col-1 ${article.read ? "read" : ""}`}>
      <div className="article-header">
        <span className="publication">
          {article.publication} ({localDate}) AI: {article.ai_score2}{" "}
          {article.agent === "USER" ? "USER: " + article.score : ""}
        </span>
        <div className="article-actions">
          <button
            onClick={handleThumbsUp}
            className={`thumbs-up ${
              article.score > 0
                ? article.agent === "USER"
                  ? "thumbs-up-active"
                  : "thumbs-up-active-light"
                : ""
            }`}
          >
            <svg width={buttonSize} height={buttonSize} viewBox="0 0 24 24">
              <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"></path>
            </svg>
          </button>
          <button
            onClick={handleThumbsDown}
            className={`thumbs-down ${
              article.score < 0
                ? article.agent === "USER"
                  ? "thumbs-down-active"
                  : "thumbs-down-active-light"
                : ""
            }`}
          >
            <svg width={buttonSize} height={buttonSize} viewBox="0 0 24 24">
              <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l.95-4.57-.03-.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"></path>
            </svg>
          </button>
          <button
            onClick={handleSave}
            className={`save ${article.saved ? "saved" : ""}`}
          >
            <svg width={buttonSize} height={buttonSize} viewBox="0 0 24 24">
              <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zM5 19V5h11.17L19 7.83V19H5zm7-14h-2v6h2V5zm0 8h-2v2h2v-2z"></path>
            </svg>
          </button>
          <button
            onClick={handleArchive}
            className={`archive ${article.archived ? "archived" : ""}`}
          >
            <svg width={buttonSize} height={buttonSize} viewBox="0 0 24 24">
              <path d="M19.81 2H4.2C3.54 2 3 2.54 3 3.2v17.6c0 .66.54 1.2 1.2 1.2h15.6c.67 0 1.2-.54 1.2-1.2V3.2C21 2.54 20.47 2 19.81 2zM12 18l-6-6h4V8h4v4h4l-6 6z"></path>
            </svg>
          </button>
        </div>
      </div>
      <div className="article-tags">
        {article.tags_scope?.map((tag, index) => (
          <span key={`scope-${index}`} className="tag tag-scope">
            {tag}
          </span>
        ))}
        {article.tags_mood?.map((tag, index) => {
          let moodColor = "#99ccff"; // Default blue
          if (tag.toLowerCase() === "upbeat") {
            moodColor = "#800080"; // Purple
          } else if (tag.toLowerCase() === "heavy") {
            moodColor = "#000000"; // Black
          }
          return (
            <span
              key={`mood-${index}`}
              className="tag"
              style={{ backgroundColor: moodColor }}
            >
              {tag}
            </span>
          );
        })}
        {article.tags_topic?.map((tag, index) => (
          <span key={`topic-${index}`} className="tag tag-topic">
            {tag}
          </span>
        ))}
      </div>
      <style jsx>{`
        .tag {
          display: inline-block;
          padding: 4px 8px;
          margin: 2px;
          border-radius: 4px;
          font-size: 12px;
          color: white;
        }
        .tag-scope {
          background-color: rgb(234, 67, 53); /* Red */
        }
        .tag-topic {
          background-color: rgb(52, 168, 83); /* Green */
        }
      `}</style>
      <a
        href={article.link}
        className="article-content"
        onClick={handleArticleClick}
      >
        <h4>{article.title}</h4>
        <p>{shortSummary}</p>
      </a>
    </div>
  );
}
