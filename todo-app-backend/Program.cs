using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Services
builder.Services.AddDbContext<TodoDb>(opt => opt.UseSqlite("Data Source=todo.db"));
//builder.Services.AddDatabaseDeveloperPageExceptionFilter();

// Enable CORS so your React app can communicate with the API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy => policy.WithOrigins(
                        "http://localhost:5173", 
                        "https://your-future-vercel-app-url.vercel.app" // You will update this later!
                    ) 
                    .AllowAnyMethod()
                    .AllowAnyHeader());
});

var app = builder.Build();
using (var scope = app.Services.CreateScope()) {
    var db = scope.ServiceProvider.GetRequiredService<TodoDb>();
    db.Database.EnsureCreated();
}

app.UseCors("AllowReactApp");

// 2. Define CRUD Routes (Minimal APIs)

// READ All
app.MapGet("/todoitems", async (TodoDb db) =>
    await db.Todos.ToListAsync());

// READ Single
app.MapGet("/todoitems/{id}", async (int id, TodoDb db) =>
    await db.Todos.FindAsync(id)
        is Todo todo
            ? Results.Ok(todo)
            : Results.NotFound());

// CREATE
app.MapPost("/todoitems", async (Todo todo, TodoDb db) =>
{
    db.Todos.Add(todo);
    await db.SaveChangesAsync();
    return Results.Created($"/todoitems/{todo.Id}", todo);
});

// UPDATE
app.MapPut("/todoitems/{id}", async (int id, Todo inputTodo, TodoDb db) =>
{
    var todo = await db.Todos.FindAsync(id);
    if (todo is null) return Results.NotFound();

    todo.Name = inputTodo.Name;
    todo.IsComplete = inputTodo.IsComplete;
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// DELETE
app.MapDelete("/todoitems/{id}", async (int id, TodoDb db) =>
{
    if (await db.Todos.FindAsync(id) is Todo todo)
    {
        db.Todos.Remove(todo);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
    return Results.NotFound();
});

app.Run();

// 3. Define Data Models
public class Todo
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public bool IsComplete { get; set; }
}

public class TodoDb : DbContext
{
    public TodoDb(DbContextOptions<TodoDb> options) : base(options) { }
    public DbSet<Todo> Todos => Set<Todo>();
}