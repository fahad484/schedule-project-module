import Link from "next/link";
import {
  Calendar,
  Clock,
  ShieldCheck,
  Award,
  Search,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-20 md:py-32">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                Modern Healthcare at Your Fingertips
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-foreground">
                Book Your Doctor Appointments <span className="text-primary">Online</span>
              </h1>

              <p className="mt-6 text-lg text-muted-foreground sm:text-xl leading-relaxed">
                Connect with top-rated medical practitioners, check live availability, and schedule your consultations in just a few clicks. No waiting on hold, no hassle.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base shadow-lg" asChild>
                  <Link href="/doctors">
                    <Search className="mr-2 h-5 w-5" />
                    Find a Doctor
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base" asChild>
                  <Link href="/register">
                    Create an Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Stats Bar */}
              <div className="mt-16 grid grid-cols-2 gap-4 border-y border-border/80 py-8 sm:grid-cols-4">
                <div>
                  <p className="text-3xl font-extrabold text-primary">500+</p>
                  <p className="text-xs text-muted-foreground mt-1">Verified Doctors</p>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-primary">25+</p>
                  <p className="text-xs text-muted-foreground mt-1">Medical Specialties</p>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-primary">15,000+</p>
                  <p className="text-xs text-muted-foreground mt-1">Happy Patients</p>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-primary">99.8%</p>
                  <p className="text-xs text-muted-foreground mt-1">Satisfaction Rate</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Why Patients Choose MedBook
              </h2>
              <p className="mt-3 text-muted-foreground">
                We simplify the process of finding and booking healthcare appointments with verified professionals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border border-border/60 shadow-sm transition-all hover:shadow-md">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                    <Award className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Verified Specialists</CardTitle>
                  <CardDescription>
                    All doctors in our network are thoroughly verified with authentic credentials and license verification.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Browse real ratings and verified reviews from past patients before booking.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-border/60 shadow-sm transition-all hover:shadow-md">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                    <Clock className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Instant Live Slots</CardTitle>
                  <CardDescription>
                    See real-time doctor availability and secure your appointment slot immediately with no delays.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Direct calendar sync ensures you never encounter conflicting double-bookings.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-border/60 shadow-sm transition-all hover:shadow-md">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Smart Management</CardTitle>
                  <CardDescription>
                    Easily reschedule, cancel, or track past visits and clinical follow-ups directly from your dashboard.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Automated notifications keep you informed ahead of your scheduled visits.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-border/60 shadow-sm transition-all hover:shadow-md">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Privacy & Security</CardTitle>
                  <CardDescription>
                    Your health information is confidential. We adhere to stringent medical data privacy guidelines.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    End-to-end security measures protect every appointment request and patient profile.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-3 text-muted-foreground">
                Get the medical attention you deserve in three simple steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-border/60 bg-card">
                <div className="relative mb-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                    <Search className="h-8 w-8" />
                  </div>
                  <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                    1
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Find Your Specialist</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Search by specialty, location, or doctor name. Filter by consultation fee and patient reviews to find your match.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-border/60 bg-card">
                <div className="relative mb-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                    <Calendar className="h-8 w-8" />
                  </div>
                  <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                    2
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Pick Date & Time</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Select a convenient date and view real-time open time slots. Choose an available slot that works best for you.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-border/60 bg-card">
                <div className="relative mb-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                    3
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Receive Instant Confirmation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Provide your reason for visit and confirm. Receive immediate confirmation along with calendar reminders.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Book Your Next Consultation?
            </h2>
            <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto text-base sm:text-lg">
              Join thousands of patients who manage their doctor appointments online with MedBook.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" variant="secondary" className="shadow-md h-12 px-8 font-semibold" asChild>
                <Link href="/doctors">Browse All Doctors</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary h-12 px-8"
                asChild
              >
                <Link href="/register">Sign Up as a Patient or Doctor</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
