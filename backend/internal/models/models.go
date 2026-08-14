package models

import "time"

type Course struct {
	ID                 string   `json:"id"`
	Title              string   `json:"title"`
	Description        string   `json:"description"`
	Category           string   `json:"category"`
	Vertical           string   `json:"vertical"`
	Language           string   `json:"language"`
	Level              string   `json:"level"`
	Duration           string   `json:"duration"`
	Students           int      `json:"students"`
	Rating             float64  `json:"rating"`
	Instructor         string   `json:"instructor"`
	Image              string   `json:"image"`
	Status             string   `json:"status"`
	Overview           string   `json:"overview,omitempty"`
	LearningObjectives []string `json:"learningObjectives,omitempty"`
	Audience           string   `json:"audience,omitempty"`
	Modules            []Module `json:"modules,omitempty"`
}

type Module struct {
	ID       string `json:"id"`
	CourseID string `json:"courseId"`
	Title    string `json:"title"`
	Order    int    `json:"order"`
	VideoURL string `json:"videoUrl"`
	Duration string `json:"duration"`
	Content  string `json:"content"`
	Quiz     *Quiz  `json:"quiz,omitempty"`
}

type Quiz struct {
	ID        string         `json:"id"`
	ModuleID  string         `json:"moduleId"`
	Title     string         `json:"title"`
	PassScore int            `json:"passScore"`
	XPReward  int            `json:"xpReward"`
	Questions []QuizQuestion `json:"questions"`
}

type QuizQuestion struct {
	Question string   `json:"question"`
	Options  []string `json:"options"`
	Answer   int      `json:"answer"`
}

type Category struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Icon        string `json:"icon"`
	Color       string `json:"color"`
	CourseCount int    `json:"courseCount"`
	Status      string `json:"status"`
}

type Mentor struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	Email     string   `json:"email"`
	Expertise []string `json:"expertise"`
	Vertical  string   `json:"vertical"`
	Bio       string   `json:"bio"`
	Rating    float64  `json:"rating"`
	Students  int      `json:"students"`
	Status    string   `json:"status"`
	Avatar    string   `json:"avatar"`
}

type User struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	Vertical  string    `json:"vertical"`
	Location  string    `json:"location"`
	Phone     string    `json:"phone"`
	Bio       string    `json:"bio"`
	Avatar    string    `json:"avatar"`
	Skills    []string  `json:"skills"`
	CreatedAt time.Time `json:"createdAt"`
	Status    string    `json:"status"`
}

type Enrollment struct {
	ID                 string        `json:"id"`
	UserID             string        `json:"userId"`
	CourseID           string        `json:"courseId"`
	Progress           int           `json:"progress"`
	XP                 int           `json:"xp"`
	Grade              string        `json:"grade"`
	LastModuleID       string        `json:"lastModuleId,omitempty"`
	EnrolledAt         time.Time     `json:"enrolledAt"`
	UpdatedAt          time.Time     `json:"updatedAt"`
	Course             *Course       `json:"course,omitempty"`
	CompletedModuleIDs []string      `json:"completedModuleIds,omitempty"`
	QuizAttempts       []QuizAttempt `json:"quizAttempts,omitempty"`
}

type QuizAttempt struct {
	ID           string    `json:"id"`
	UserID       string    `json:"userId"`
	QuizID       string    `json:"quizId"`
	EnrollmentID string    `json:"enrollmentId,omitempty"`
	Score        int       `json:"score"`
	Passed       bool      `json:"passed"`
	Answers      []int     `json:"answers,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
}

type Certification struct {
	ID        string     `json:"id"`
	UserID    string     `json:"userId"`
	Name      string     `json:"name"`
	Issuer    string     `json:"issuer"`
	ExpiresAt *time.Time `json:"expiresAt"`
	Status    string     `json:"status"`
	DaysLeft  int        `json:"daysLeft"`
}

type Notification struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	Type      string    `json:"type"`
	Message   string    `json:"message"`
	Read      bool      `json:"read"`
	CreatedAt time.Time `json:"createdAt"`
}

type Skill struct {
	ID     string `json:"id"`
	UserID string `json:"userId"`
	Name   string `json:"name"`
	Level  int    `json:"level"`
}

type Program struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Agency      string   `json:"agency"`
	Description string   `json:"description"`
	ProgramType string   `json:"programType"`
	Eligibility []string `json:"eligibility"`
	Funding     string   `json:"funding"`
	Deadline    string   `json:"deadline"`
	Verticals   []string `json:"verticals"`
}

type VisaProgram struct {
	ID            string   `json:"id"`
	Title         string   `json:"title"`
	VisaType      string   `json:"visaType"`
	Category      string   `json:"category"`
	Description   string   `json:"description"`
	Eligibility   []string `json:"eligibility"`
	Duration      string   `json:"duration"`
	IndustryMatch []string `json:"industryMatch"`
}

type MarketplaceEntry struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Vertical    string   `json:"vertical"`
	Description string   `json:"description"`
	Location    string   `json:"location"`
	Founded     string   `json:"founded"`
	Employees   string   `json:"employees"`
	Tags        []string `json:"tags"`
}

type CommunityPost struct {
	ID        string    `json:"id"`
	AuthorID  string    `json:"authorId"`
	Author    string    `json:"author"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	Category  string    `json:"category"`
	Likes     int       `json:"likes"`
	CreatedAt time.Time `json:"createdAt"`
}

type CommunityEvent struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	EventDate time.Time `json:"date"`
	Type      string    `json:"type"`
	Attendees int       `json:"attendees"`
}

type CommunityGroup struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Category string `json:"category"`
	Members  int    `json:"members"`
	Icon     string `json:"icon"`
}

type EntrepreneurshipTrack struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Order       int    `json:"order"`
}

type EntrepreneurshipResource struct {
	ID          string `json:"id"`
	Category    string `json:"category"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Items       int    `json:"items"`
}

type Candidate struct {
	ID             string   `json:"id"`
	UserID         string   `json:"userId"`
	Name           string   `json:"name"`
	Title          string   `json:"title"`
	Skills         []string `json:"skills"`
	Location       string   `json:"location"`
	Zip            string   `json:"zip"`
	BillingRate    int      `json:"billingRate"`
	Vertical       string   `json:"vertical"`
	Education      string   `json:"education"`
	Programs       []string `json:"programs"`
	Rating         float64  `json:"rating"`
	Experience     string   `json:"experience"`
	Bio            string   `json:"bio,omitempty"`
	Email          string   `json:"email,omitempty"`
	Availability   string   `json:"availability,omitempty"`
	OpenToRelocate bool     `json:"openToRelocate"`
	Phone          string   `json:"phone,omitempty"`
	VisaStatus     string   `json:"visaStatus,omitempty"`
	Lat            *float64 `json:"lat,omitempty"`
	Lng            *float64 `json:"lng,omitempty"`
	ResumeURL      string   `json:"resumeUrl,omitempty"`
	ResumeText     string   `json:"resumeText,omitempty"`
}

type AuthUser struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	Vertical string `json:"vertical"`
}

type SavedCourse struct {
	ID       string    `json:"id"`
	UserID   string    `json:"userId"`
	CourseID string    `json:"courseId"`
	SavedAt  time.Time `json:"savedAt"`
	Course   *Course   `json:"course,omitempty"`
}

type MentorBooking struct {
	ID              string    `json:"id"`
	UserID          string    `json:"userId"`
	MentorID        string    `json:"mentorId"`
	ScheduledAt     time.Time `json:"scheduledAt"`
	DurationMinutes int       `json:"durationMinutes"`
	Topic           string    `json:"topic"`
	Notes           string    `json:"notes"`
	Status          string    `json:"status"`
	CreatedAt       time.Time `json:"createdAt"`
	Mentor          *Mentor   `json:"mentor,omitempty"`
}
