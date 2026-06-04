using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;
using EnterpriseTicTacToe.API.Services;
using EnterpriseTicTacToe.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Register application-specific services as Singletons to maintain in-memory state across requests.
builder.Services.AddSingleton<IScoreboardService, ScoreboardService>();
builder.Services.AddSingleton<IGameService, GameService>();

// Configure OpenAPI/Swagger for self-documentation.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "Enterprise Tic-Tac-Toe Web API", 
        Version = "v1",
        Description = "A production-ready C# .NET Core Web API demonstrating clean architecture, thread-safe memory management, and robust gaming logic."
    });
});

// Configure CORS for Angular frontend integration.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AngularDevPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "https://localhost:4200") // Default Angular Dev endpoints
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Enable Global Exception Handler Middleware at the start of Request Pipeline
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment() || true) // Enable Swagger in demo environment
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Enterprise Tic-Tac-Toe v1");
        c.RoutePrefix = string.Empty; // Swagger UI at root index
    });
}

app.UseHttpsRedirection();

// Enforce CORS setup
app.UseCors("AngularDevPolicy");

app.UseAuthorization();

app.MapControllers();

app.Run();
