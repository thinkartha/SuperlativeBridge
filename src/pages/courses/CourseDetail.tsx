import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import CourseCover from "@/components/CourseCover";
import ModuleVideoPreview from "@/components/ModuleVideoPreview";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  Users,
  Globe,
  Star,
  Play,
  FileText,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Target,
  Circle,
} from "lucide-react";
import { useCourse } from "@/hooks/api";
import {
  useEnrollments,
  useEnroll,
  useUpdateEnrollmentProgress,
  useUnenroll,
  useSubmitQuiz,
} from "@/hooks/api/useEnrollments";
import {
  useSavedCourses,
  useSaveCourse,
  useUnsaveCourse,
} from "@/hooks/api/useSavedCourses";
import { useAuth } from "@/contexts/AuthContext";
import type { Quiz } from "@/types/api";

const MODULES_PER_PAGE = 5;

function answerIndex(answer: number | string) {
  const n = typeof answer === "number" ? answer : Number(answer);
  return Number.isFinite(n) ? n : -1;
}

const CourseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: course, isLoading, isError, refetch } = useCourse(id);
  const { data: enrollments } = useEnrollments(user?.id);
  const { data: savedCourses } = useSavedCourses(user?.id);
  const enrollMutation = useEnroll(user?.id);
  const unenrollMutation = useUnenroll(user?.id);
  const updateProgressMutation = useUpdateEnrollmentProgress(user?.id);
  const submitQuiz = useSubmitQuiz(user?.id);
  const saveMutation = useSaveCourse(user?.id);
  const unsaveMutation = useUnsaveCourse(user?.id);

  const [expandedModules, setExpandedModules] = useState<number[]>([0]);
  const [activeTab, setActiveTab] = useState<
    "overview" | "modules" | "quizzes" | "progress"
  >("overview");
  const [modulePage, setModulePage] = useState(1);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
  } | null>(null);

  const enrollment = enrollments?.find((e) => e.courseId === id);
  const isSaved = (savedCourses ?? []).some((s) => s.courseId === id);
  const progressPct = enrollment?.progress ?? 0;
  const completed = new Set(enrollment?.completedModuleIds ?? []);

  const toggleModule = (i: number) => {
    setExpandedModules((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
    );
  };

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setQuizStep(0);
    setQuizAnswers([]);
    setQuizResult(null);
    setActiveTab("quizzes");
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-8">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground mb-4">Unable to load this course.</p>
        <Button variant="outline" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  const modules = course.modules ?? [];
  const moduleTotalPages = Math.max(1, Math.ceil(modules.length / MODULES_PER_PAGE));
  const currentModulePage = Math.min(modulePage, moduleTotalPages);
  const pagedModules = modules
    .map((mod, mi) => ({ mod, mi }))
    .slice(
      (currentModulePage - 1) * MODULES_PER_PAGE,
      currentModulePage * MODULES_PER_PAGE,
    );
  const quizModules = modules.filter((m) => m.quiz);
  const totalModules = modules.length;
  const objectives = course.learningObjectives ?? [];

  const latestAttempt = (quizId: string) =>
    enrollment?.quizAttempts?.find((a) => a.quizId === quizId);

  const markModuleComplete = (moduleId: string) => {
    if (!enrollment) return;
    updateProgressMutation.mutate({
      id: enrollment.id,
      xp: enrollment.xp + 10,
      lastModuleId: moduleId,
    });
  };

  const submitCurrentQuiz = () => {
    if (!activeQuiz) return;
    submitQuiz.mutate(
      { quizId: activeQuiz.id, answers: quizAnswers },
      {
        onSuccess: (attempt) =>
          setQuizResult({ score: attempt.score, passed: attempt.passed }),
      },
    );
  };

  return (
    <div>
      <div className="bg-card border-b border-border -mx-6 lg:-mx-10 px-6 lg:px-10">
        <div className="py-8">
          <div className="flex flex-col lg:flex-row lg:items-start gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Link
                  to="/courses"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Courses
                </Link>
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                <span className="text-sm text-foreground">{course.title}</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">{course.category}</Badge>
                <Badge variant="secondary">{course.level}</Badge>
              </div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl lg:text-4xl font-heading font-bold text-foreground mb-3">
                  {course.title}
                </h1>
                {user && (
                  <button
                    onClick={() =>
                      isSaved
                        ? unsaveMutation.mutate(course.id)
                        : saveMutation.mutate(course.id)
                    }
                    className="shrink-0 flex items-center gap-1.5 text-sm border border-border px-3 py-1.5 hover:bg-muted/40"
                  >
                    {isSaved ? (
                      <BookmarkCheck className="w-4 h-4 text-primary" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                    {isSaved ? "Saved" : "Save"}
                  </button>
                )}
              </div>
              <p className="text-muted-foreground text-lg mb-4">
                {course.description}
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {course.rating} rating
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {course.students?.toLocaleString()} students
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {course.duration}
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {course.language}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Instructor:{" "}
                <span className="text-foreground font-medium">
                  {course.instructor}
                </span>
              </p>
            </div>
            <div className="lg:w-80 bg-background border border-border p-6 shrink-0">
              <CourseCover
                src={course.image}
                alt={course.title}
                className="w-full h-32 object-cover mb-4"
              />
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold text-foreground">
                    {progressPct}%
                  </span>
                </div>
                <Progress value={progressPct} className="h-2" />
                {enrollment ? (
                  <p className="text-xs text-muted-foreground">
                    XP earned: {enrollment.xp} · {completed.size}/{totalModules}{" "}
                    modules
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    You are not enrolled yet.
                  </p>
                )}
              </div>
              {!user ? (
                <p className="text-xs text-muted-foreground text-center">
                  Sign in to enroll in this course.
                </p>
              ) : enrollment ? (
                <div className="space-y-2">
                  <Button
                    variant="hero"
                    className="w-full"
                    onClick={() => setActiveTab("modules")}
                  >
                    Continue Learning
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={unenrollMutation.isPending}
                    onClick={() => unenrollMutation.mutate(enrollment.id)}
                  >
                    Opt Out of Course
                  </Button>
                </div>
              ) : (
                <Button
                  variant="hero"
                  className="w-full"
                  disabled={enrollMutation.isPending}
                  onClick={() => enrollMutation.mutate(course.id)}
                >
                  Enroll Now
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="py-8">
        <div className="flex gap-1 border-b border-border mb-8">
          {(["overview", "modules", "quizzes", "progress"] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ),
          )}
        </div>

        {activeTab === "overview" && (
          <div className="w-full space-y-8">
            <div className="grid sm:grid-cols-3 border border-border">
              <div className="px-5 py-4 border-b sm:border-b-0 sm:border-r border-border">
                <p className="text-xs text-muted-foreground">Modules</p>
                <p className="text-xl font-heading font-bold text-foreground">
                  {totalModules}
                </p>
              </div>
              <div className="px-5 py-4 border-b sm:border-b-0 sm:border-r border-border">
                <p className="text-xs text-muted-foreground">Quizzes</p>
                <p className="text-xl font-heading font-bold text-foreground">
                  {quizModules.length}
                </p>
              </div>
              <div className="px-5 py-4">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-xl font-heading font-bold text-foreground">
                  {course.status}
                </p>
              </div>
            </div>
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-heading font-bold text-foreground mb-4">
                  About This Course
                </h2>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {course.overview || course.description}
                </p>
              </div>
              {objectives.length > 0 && (
                <div>
                  <h2 className="text-xl font-heading font-bold text-foreground mb-4">
                    What you will learn
                  </h2>
                  <ul className="space-y-2">
                    {objectives.map((obj) => (
                      <li
                        key={obj}
                        className="flex items-start gap-2 text-sm text-foreground"
                      >
                        <Target className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {course.audience && (
                <div>
                  <h2 className="text-xl font-heading font-bold text-foreground mb-3">
                    Who this is for
                  </h2>
                  <p className="text-sm text-foreground leading-relaxed">
                    {course.audience}
                  </p>
                </div>
              )}
              {modules.length > 0 && (
                <div>
                  <h2 className="text-xl font-heading font-bold text-foreground mb-4">
                    Syllabus
                  </h2>
                  <ol className="space-y-2">
                    {modules.map((mod, i) => (
                      <li
                        key={mod.id}
                        className="flex items-center justify-between border border-border px-4 py-3 text-sm"
                      >
                        <span className="text-foreground">
                          {i + 1}. {mod.title}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {mod.duration}
                          {mod.quiz ? " · quiz" : ""}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "modules" && (
          <div className="w-full space-y-3">
            {modules.length === 0 && (
              <p className="text-muted-foreground text-sm">
                No modules have been published for this course yet.
              </p>
            )}
            {pagedModules.map(({ mod, mi }) => {
              const expanded = expandedModules.includes(mi);
              const isCompleted = completed.has(mod.id);
              return (
                <div
                  key={mod.id}
                  className="bg-card border border-border overflow-hidden"
                >
                  <button
                    onClick={() => toggleModule(mi)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center text-xs font-bold shrink-0 bg-primary/10 text-primary">
                        {mod.order ?? mi + 1}
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-foreground text-sm">
                          {mod.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {mod.duration}
                          {mod.videoUrl ? " · video" : ""}
                          {mod.quiz ? " · quiz" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isCompleted && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>
                  {expanded && (
                    <div className="border-t border-border divide-y divide-border">
                      <div className="px-5 py-4 space-y-2">
                        <p className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Play className="w-4 h-4 text-primary" /> Video
                          preview
                        </p>
                        <ModuleVideoPreview
                          title={mod.title}
                          videoUrl={mod.videoUrl}
                          fallbackSrc={course.image}
                          duration={mod.duration}
                        />
                      </div>
                      {mod.content && (
                        <div className="px-5 py-4 space-y-2">
                          <p className="text-sm font-medium text-foreground flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-muted-foreground" />{" "}
                            Lesson notes
                          </p>
                          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                            {mod.content}
                          </p>
                        </div>
                      )}
                      {mod.quiz && (
                        <div className="flex items-center justify-between px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-primary" />
                            <p className="text-sm text-foreground">
                              {mod.quiz.title}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startQuiz(mod.quiz!)}
                          >
                            Take Quiz
                          </Button>
                        </div>
                      )}
                      {enrollment && (
                        <div className="px-5 py-3.5">
                          <Button
                            size="sm"
                            variant={isCompleted ? "outline" : "hero"}
                            disabled={
                              isCompleted || updateProgressMutation.isPending
                            }
                            onClick={() => markModuleComplete(mod.id)}
                          >
                            {isCompleted ? "Completed" : "Mark Module Complete"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {modules.length > MODULES_PER_PAGE && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentModulePage - 1) * MODULES_PER_PAGE + 1}–
                  {Math.min(
                    currentModulePage * MODULES_PER_PAGE,
                    modules.length,
                  )}{" "}
                  of {modules.length} modules
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                    disabled={currentModulePage <= 1}
                    onClick={() => setModulePage(currentModulePage - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </Button>
                  {Array.from({ length: moduleTotalPages }, (_, i) => (
                    <Button
                      key={i}
                      variant={
                        currentModulePage === i + 1 ? "default" : "outline"
                      }
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setModulePage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                    disabled={currentModulePage >= moduleTotalPages}
                    onClick={() => setModulePage(currentModulePage + 1)}
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "quizzes" && (
          <div className="w-full space-y-4">
            {activeQuiz ? (
              <div className="bg-card border border-border p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Quiz
                    </p>
                    <h3 className="font-heading font-semibold text-foreground">
                      {activeQuiz.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pass score {activeQuiz.passScore}% ·{" "}
                      {activeQuiz.questions.length} questions ·{" "}
                      {activeQuiz.xpReward} XP
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveQuiz(null);
                      setQuizResult(null);
                    }}
                  >
                    Back to list
                  </Button>
                </div>

                {quizResult ? (
                  <div className="border border-border p-5 space-y-3">
                    <p className="text-2xl font-heading font-bold text-foreground">
                      {quizResult.score}%
                    </p>
                    <p className="text-sm text-foreground">
                      {quizResult.passed
                        ? "You passed this checkpoint."
                        : "Below the pass score — review the lesson and try again."}
                    </p>
                    <Button
                      variant="hero"
                      onClick={() => startQuiz(activeQuiz)}
                    >
                      Retake
                    </Button>
                  </div>
                ) : (
                  <>
                    <Progress
                      value={
                        ((quizStep + 1) / activeQuiz.questions.length) * 100
                      }
                      className="h-1.5"
                    />
                    <p className="text-xs text-muted-foreground">
                      Question {quizStep + 1} of {activeQuiz.questions.length}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {activeQuiz.questions[quizStep].question}
                    </p>
                    <div className="space-y-2">
                      {activeQuiz.questions[quizStep].options.map((opt, oi) => {
                        const selected = quizAnswers[quizStep] === oi;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              const next = [...quizAnswers];
                              next[quizStep] = oi;
                              setQuizAnswers(next);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm border ${
                              selected
                                ? "border-primary bg-primary/5 text-foreground"
                                : "border-border text-foreground hover:bg-muted/30"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={quizStep === 0}
                        onClick={() => setQuizStep((s) => s - 1)}
                      >
                        Previous
                      </Button>
                      {quizStep < activeQuiz.questions.length - 1 ? (
                        <Button
                          size="sm"
                          disabled={quizAnswers[quizStep] === undefined}
                          onClick={() => setQuizStep((s) => s + 1)}
                        >
                          Next
                        </Button>
                      ) : (
                        <Button
                          variant="hero"
                          size="sm"
                          disabled={
                            quizAnswers.length < activeQuiz.questions.length ||
                            submitQuiz.isPending ||
                            !enrollment
                          }
                          onClick={submitCurrentQuiz}
                        >
                          {enrollment ? "Submit quiz" : "Enroll to submit"}
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                {quizModules.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    No quizzes available for this course yet.
                  </p>
                )}
                {quizModules.map((mod) => {
                  const attempt = latestAttempt(mod.quiz!.id);
                  return (
                    <div
                      key={mod.id}
                      className="bg-card border border-border p-5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center bg-primary/10">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-heading font-semibold text-foreground text-sm">
                            {mod.quiz!.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {mod.title} · Pass {mod.quiz!.passScore}% ·{" "}
                            {mod.quiz!.questions.length} questions
                            {attempt
                              ? ` · last score ${attempt.score}%${attempt.passed ? " (passed)" : ""}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => startQuiz(mod.quiz!)}
                      >
                        {attempt ? "Retake Quiz" : "Take Quiz"}
                      </Button>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {activeTab === "progress" && (
          <div className="w-full space-y-6">
            {!enrollment ? (
              <p className="text-sm text-muted-foreground">
                Enroll to track module completion and quiz scores.
              </p>
            ) : (
              <>
                <div className="bg-card border border-border p-5">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                      Overall completion
                    </span>
                    <span className="font-semibold text-foreground">
                      {progressPct}%
                    </span>
                  </div>
                  <Progress value={progressPct} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {completed.size} of {totalModules} modules · {enrollment.xp}{" "}
                    XP
                  </p>
                </div>
                <div className="space-y-2">
                  {modules.map((mod, i) => {
                    const done = completed.has(mod.id);
                    const attempt = mod.quiz
                      ? latestAttempt(mod.quiz.id)
                      : undefined;
                    return (
                      <div
                        key={mod.id}
                        className="flex items-start gap-3 border border-border px-4 py-3"
                      >
                        {done ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">
                            {i + 1}. {mod.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {done ? "Module complete" : "Not started"}
                            {mod.quiz
                              ? attempt
                                ? ` · quiz ${attempt.score}%${attempt.passed ? " passed" : " not passed"}`
                                : " · quiz not taken"
                              : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;
