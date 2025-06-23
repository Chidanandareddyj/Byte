from manim import *
import numpy as np

class MathSceneGenerator:
    @staticmethod
    def create_algebra_scene(scene, content):
        # Handle algebraic equations and expressions
        equation = MathTex(content["equation"])
        scene.play(Write(equation))
        
        if "steps" in content:
            current_eq = equation
            for step in content["steps"]:
                new_eq = MathTex(step)
                new_eq.next_to(current_eq, DOWN)
                scene.play(
                    Write(new_eq),
                    current_eq.animate.set_color(GRAY)
                )
                current_eq = new_eq
                scene.wait(1)

    @staticmethod
    def create_geometry_scene(scene, content):
        # Handle geometric concepts
        if content["type"] == "circle":
            circle = Circle(radius=2)
            scene.play(Create(circle))
            
            if "show_radius":
                radius = Line(circle.get_center(), circle.point_at_angle(0))
                r_label = MathTex("r").next_to(radius, UP)
                scene.play(Create(radius), Write(r_label))
                
            if "show_area":
                area_formula = MathTex("A = \\pi r^2")
                area_formula.to_edge(UP)
                scene.play(Write(area_formula))

        elif content["type"] == "triangle":
            triangle = Triangle()
            scene.play(Create(triangle))
            
            if "show_angles":
                angles = VGroup(*[
                    Angle(
                        triangle.get_vertices()[(i+1)%3] - triangle.get_vertices()[i],
                        triangle.get_vertices()[(i-1)%3] - triangle.get_vertices()[i],
                        radius=0.5
                    )
                    for i in range(3)
                ])
                scene.play(Create(angles))

    @staticmethod
    def create_calculus_scene(scene, content):
        # Handle calculus concepts
        if content["type"] == "derivative":
            # Show function and its derivative
            axes = Axes(
                x_range=[-3, 3],
                y_range=[-2, 2],
                axis_config={"include_tip": True},
            )
            scene.play(Create(axes))
            
            # Original function
            function = axes.plot(lambda x: np.sin(x), color=BLUE)
            func_label = MathTex("f(x) = \\sin(x)").next_to(axes, UP)
            scene.play(Create(function), Write(func_label))
            
            # Derivative
            derivative = axes.plot(lambda x: np.cos(x), color=RED)
            deriv_label = MathTex("f'(x) = \\cos(x)").next_to(func_label, DOWN)
            scene.play(Create(derivative), Write(deriv_label))

        elif content["type"] == "integral":
            axes = Axes(
                x_range=[0, 4],
                y_range=[0, 4],
                axis_config={"include_tip": True},
            )
            scene.play(Create(axes))
            
            # Function and area under curve
            function = axes.plot(lambda x: x**2, color=BLUE)
            area = axes.get_area(function, [0, 2], color=YELLOW, opacity=0.3)
            scene.play(Create(function))
            scene.play(Create(area))
            
            integral = MathTex("\\int_0^2 x^2 dx").to_edge(UP)
            scene.play(Write(integral))

class DynamicMathScene(Scene):
    def __init__(self, content, *args, **kwargs):
        self.content = content
        super().__init__(*args, **kwargs)
    
    def construct(self):
        # Title
        title = Text(self.content["topic"], font_size=40)
        self.play(Write(title))
        self.wait()
        self.play(title.animate.to_edge(UP))
        
        # Generate the appropriate type of scene based on content
        if self.content["category"] == "algebra":
            MathSceneGenerator.create_algebra_scene(self, self.content)
        elif self.content["category"] == "geometry":
            MathSceneGenerator.create_geometry_scene(self, self.content)
        elif self.content["category"] == "calculus":
            MathSceneGenerator.create_calculus_scene(self, self.content)
        
        # Add explanation if provided
        if "explanation" in self.content:
            explanation = Text(self.content["explanation"], font_size=24)
            explanation.to_edge(DOWN)
            self.play(Write(explanation))
            self.wait(2) 